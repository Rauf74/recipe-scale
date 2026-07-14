// Package apperror menyediakan typed error + Fiber error handler middleware
// untuk response yang konsisten di seluruh API.
//
// Code adalah machine-readable identifier (frontend bisa switch/case).
// Message adalah human-readable (BHS Indonesia untuk user-facing).
// HTTPStatus sudah final, tidak perlu handler tentukan lagi per-call.
// Cause adalah error asli untuk logging server-side (tidak di-expose ke client).
package apperror

import (
	"errors"
	"log"

	"github.com/gofiber/fiber/v2"
)

// AppError adalah error terstruktur yang dipetakan langsung ke HTTP response.
type AppError struct {
	Code       string
	Message    string
	HTTPStatus int
	Cause      error
}

func (e *AppError) Error() string {
	if e.Cause != nil {
		return e.Message + ": " + e.Cause.Error()
	}
	return e.Message
}

func (e *AppError) Unwrap() error { return e.Cause }

// --- Constructor shortcuts ---

func NotFound(msg string, cause error) *AppError {
	return &AppError{Code: "NOT_FOUND", Message: msg, HTTPStatus: fiber.StatusNotFound, Cause: cause}
}

func BadRequest(msg string, cause error) *AppError {
	return &AppError{Code: "BAD_REQUEST", Message: msg, HTTPStatus: fiber.StatusBadRequest, Cause: cause}
}

func Unauthorized(msg string, cause error) *AppError {
	return &AppError{Code: "UNAUTHORIZED", Message: msg, HTTPStatus: fiber.StatusUnauthorized, Cause: cause}
}

func Forbidden(msg string, cause error) *AppError {
	return &AppError{Code: "FORBIDDEN", Message: msg, HTTPStatus: fiber.StatusForbidden, Cause: cause}
}

func Conflict(msg string, cause error) *AppError {
	return &AppError{Code: "CONFLICT", Message: msg, HTTPStatus: fiber.StatusConflict, Cause: cause}
}

func Internal(msg string, cause error) *AppError {
	return &AppError{Code: "INTERNAL", Message: msg, HTTPStatus: fiber.StatusInternalServerError, Cause: cause}
}

// --- Fiber integration ---

// Body untuk response JSON.
type body struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
	Code    string `json:"code"`
}

// Handler adalah Fiber error-handling middleware. Pasang via app.Use(handler).
// Mapping:
//
//	*AppError -> status + JSON envelope (code + message aman ke client, cause log)
//	fiber.Error -> status + JSON envelope (generic message)
//	default -> 500 + JSON envelope, cause di-log
func Handler(c *fiber.Ctx, err error) error {
	if err == nil {
		return nil
	}

	var appErr *AppError
	if errors.As(err, &appErr) {
		if appErr.Cause != nil {
			log.Printf("[%s] %s: %v", appErr.Code, appErr.Message, appErr.Cause)
		}
		return c.Status(appErr.HTTPStatus).JSON(body{
			Success: false,
			Error:   appErr.Message,
			Code:    appErr.Code,
		})
	}

	// Fiber framework errors (404 untuk route gak ada, 405 method not allowed, dll)
	var fiberErr *fiber.Error
	if errors.As(err, &fiberErr) {
		return c.Status(fiberErr.Code).JSON(body{
			Success: false,
			Error:   fiberErr.Message,
			Code:    "FIBER_ERROR",
		})
	}

	// Unknown error: log full, return generic 500 (no leak)
	log.Printf("[INTERNAL] %v", err)
	return c.Status(fiber.StatusInternalServerError).JSON(body{
		Success: false,
		Error:   "terjadi kesalahan internal",
		Code:    "INTERNAL",
	})
}
