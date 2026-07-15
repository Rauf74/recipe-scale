package handler

import (
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"recipe-scale/backend/internal/apperror"
	"recipe-scale/backend/internal/domain"
	"recipe-scale/backend/internal/jwtutil"
	"recipe-scale/backend/internal/middleware"
	"recipe-scale/backend/internal/service"
	"recipe-scale/backend/internal/validation"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req service.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return apperror.BadRequest("invalid request body", err)
	}
	if err := validation.ValidateRequest(&req); err != nil {
		return apperror.BadRequest(err.Error(), nil)
	}

	res, err := h.authService.RegisterWorkspace(req)
	if err != nil {
		return apperror.BadRequest(err.Error(), err)
	}

	sameSite := "Lax"
	if os.Getenv("APP_ENV") == "production" {
		sameSite = "None"
	}

	// Set JWT as HttpOnly Cookie
	c.Cookie(&fiber.Cookie{
		Name:     "jwt",
		Value:    res.Token,
		Expires:  time.Now().Add(24 * 7 * time.Hour), // 7 days
		HTTPOnly: true,
		Secure:   os.Getenv("APP_ENV") == "production",
		SameSite: sameSite,
	})

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"user": res.User,
		},
	})
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req service.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return apperror.BadRequest("invalid request body", err)
	}
	if err := validation.ValidateRequest(&req); err != nil {
		return apperror.BadRequest(err.Error(), nil)
	}

	res, err := h.authService.Login(req)
	if err != nil {
		return apperror.Unauthorized(err.Error(), err)
	}

	sameSite := "Lax"
	if os.Getenv("APP_ENV") == "production" {
		sameSite = "None"
	}

	// Set JWT as HttpOnly Cookie
	c.Cookie(&fiber.Cookie{
		Name:     "jwt",
		Value:    res.Token,
		Expires:  time.Now().Add(24 * 7 * time.Hour), // 7 days
		HTTPOnly: true,
		Secure:   os.Getenv("APP_ENV") == "production",
		SameSite: sameSite,
	})

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"user": res.User,
		},
	})
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	sameSite := "Lax"
	if os.Getenv("APP_ENV") == "production" {
		sameSite = "None"
	}

	// 1. Get the token string before clearing cookie
	tokenString := c.Cookies("jwt")
	if tokenString == "" {
		authHeader := c.Get("Authorization")
		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}

	// 2. Clear the JWT Cookie in browser
	c.Cookie(&fiber.Cookie{
		Name:     "jwt",
		Value:    "",
		Expires:  time.Now().Add(-time.Hour),
		HTTPOnly: true,
		Secure:   os.Getenv("APP_ENV") == "production",
		SameSite: sameSite,
	})

	// 3. Register valid token signature to database blacklist
	if tokenString != "" && middleware.DB != nil {
		parts := strings.Split(tokenString, ".")
		if len(parts) == 3 {
			signature := parts[2]

			jwtSecret, err := jwtutil.Secret()
			if err == nil {
				// Parse and verify token signature
				token, err := jwt.ParseWithClaims(tokenString, &service.JWTCustomClaims{}, func(t *jwt.Token) (interface{}, error) {
					return []byte(jwtSecret), nil
				}, jwt.WithValidMethods([]string{"HS256"}))

				if err == nil && token != nil && token.Valid {
					claims, ok := token.Claims.(*service.JWTCustomClaims)
					expiresAt := time.Now().Add(7 * 24 * time.Hour)
					if ok && claims.ExpiresAt != nil {
						expiresAt = claims.ExpiresAt.Time
					}

					// Insert blacklist record to DB
					blacklisted := domain.BlacklistedToken{
						ID:        uuid.New().String(),
						Signature: signature,
						ExpiresAt: expiresAt,
						CreatedAt: time.Now(),
					}
					middleware.DB.Create(&blacklisted)
				}
			}
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "logged out successfully",
	})
}

func (h *AuthHandler) Me(c *fiber.Ctx) error {
	// User ID is injected into the context by the Auth middleware
	userID, ok := c.Locals("userId").(string)
	if !ok || userID == "" {
		return apperror.Unauthorized("unauthorized", nil)
	}

	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		return apperror.NotFound("pengguna tidak ditemukan", err)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"user": user,
		},
	})
}

func (h *AuthHandler) CheckAuth(c *fiber.Ctx) error {
	// Simple validation to check if the user is logged in
	userID, ok := c.Locals("userId").(string)
	if !ok || userID == "" {
		return apperror.Unauthorized("unauthorized", nil)
	}

	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		return apperror.Unauthorized("unauthorized", err)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"user": fiber.Map{
				"id":          user.ID,
				"name":        user.Name,
				"email":       user.Email,
				"role":        user.Role,
				"workspaceId": user.WorkspaceID,
			},
		},
	})
}
