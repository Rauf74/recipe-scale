package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"

	"recipe-scale/backend/internal/jwtutil"
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
	jwtSecret, err := jwtutil.Secret()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	token, err := jwt.ParseWithClaims(tokenString, &service.JWTCustomClaims{}, func(t *jwt.Token) (interface{}, error) {
		return []byte(jwtSecret), nil
	}, jwt.WithValidMethods([]string{"HS256"}))

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
