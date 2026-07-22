package handler

import (
	"os"
	"time"

	"github.com/gofiber/fiber/v2"

	"recipe-scale/backend/internal/apperror"
	"recipe-scale/backend/internal/service"
)

type DemoHandler struct {
	demoService *service.DemoService
}

func NewDemoHandler(demoService *service.DemoService) *DemoHandler {
	return &DemoHandler{demoService: demoService}
}

func (h *DemoHandler) QuickDemo(c *fiber.Ctx) error {
	res, err := h.demoService.GenerateQuickDemoUser()
	if err != nil {
		return apperror.Internal("Gagal membuat akun demo", err)
	}

	sameSite := "Lax"
	if os.Getenv("APP_ENV") == "production" {
		sameSite = "None"
	}

	// Set JWT Cookie
	c.Cookie(&fiber.Cookie{
		Name:     "jwt",
		Value:    res.Token,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
		HTTPOnly: true,
		Secure:   os.Getenv("APP_ENV") == "production",
		SameSite: sameSite,
		Path:     "/",
	})

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"status":  "success",
		"message": "Akun demo RecipeScale berhasil dibuat",
		"data": fiber.Map{
			"user":        res.User,
			"token":       res.Token,
			"credentials": res.Credentials,
			"redirectUrl": "/",
		},
	})
}
