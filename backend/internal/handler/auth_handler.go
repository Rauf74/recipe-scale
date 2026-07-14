package handler

import (
	"time"

	"github.com/gofiber/fiber/v2"

	"recipe-scale/backend/internal/service"
	"recipe-scale/backend/internal/apperror"
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
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	res, err := h.authService.RegisterWorkspace(req)
	if err != nil {
	return apperror.BadRequest(err.Error(), err)
	}

	// Set JWT as HttpOnly Cookie
	c.Cookie(&fiber.Cookie{
		Name:     "jwt",
		Value:    res.Token,
		Expires:  time.Now().Add(24 * 7 * time.Hour), // 7 days
		HTTPOnly: true,
		Secure:   false, // Set true in production with HTTPS
		SameSite: "Lax",
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
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	res, err := h.authService.Login(req)
	if err != nil {
	return apperror.Unauthorized(err.Error(), err)
	}

	// Set JWT as HttpOnly Cookie
	c.Cookie(&fiber.Cookie{
		Name:     "jwt",
		Value:    res.Token,
		Expires:  time.Now().Add(24 * 7 * time.Hour), // 7 days
		HTTPOnly: true,
		Secure:   false,
		SameSite: "Lax",
	})

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"user": res.User,
		},
	})
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	// Clear the JWT Cookie
	c.Cookie(&fiber.Cookie{
		Name:     "jwt",
		Value:    "",
		Expires:  time.Now().Add(-time.Hour),
		HTTPOnly: true,
		Secure:   false,
		SameSite: "Lax",
	})

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "logged out successfully",
	})
}

func (h *AuthHandler) Me(c *fiber.Ctx) error {
	// User ID is injected into the context by the Auth middleware
	userID, ok := c.Locals("userId").(string)
	if !ok || userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "user not found",
		})
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
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
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
