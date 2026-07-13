package middleware

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"

	"recipe-scale/backend/internal/domain"
	"recipe-scale/backend/internal/service"
)

func RequireAuth(c *fiber.Ctx) error {
	// 1. Get token from HttpOnly Cookie
	tokenString := c.Cookies("jwt")

	// 2. Fallback to Authorization Header
	if tokenString == "" {
		authHeader := c.Get("Authorization")
		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}

	if tokenString == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: missing token",
		})
	}

	// 3. Parse and Validate Token
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "super-secret-key-recipe-scale"
	}

	token, err := jwt.ParseWithClaims(tokenString, &service.JWTCustomClaims{}, func(t *jwt.Token) (interface{}, error) {
		return []byte(jwtSecret), nil
	})

	if err != nil || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: invalid token",
		})
	}

	claims, ok := token.Claims.(*service.JWTCustomClaims)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: invalid claims",
		})
	}

	// 4. Inject claims into local context
	c.Locals("userId", claims.UserID)
	c.Locals("email", claims.Email)
	c.Locals("role", claims.Role)
	c.Locals("workspaceId", claims.WorkspaceID)

	return c.Next()
}

func RequireRole(allowedRoles ...domain.UserRole) fiber.Handler {
	return func(c *fiber.Ctx) error {
		role, ok := c.Locals("role").(domain.UserRole)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "unauthorized: role not found",
			})
		}

		for _, allowed := range allowedRoles {
			if role == allowed {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "forbidden: insufficient permissions",
		})
	}
}
