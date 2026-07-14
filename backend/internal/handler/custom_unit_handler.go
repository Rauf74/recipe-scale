package handler
import (
	"github.com/gofiber/fiber/v2"

	"recipe-scale/backend/internal/apperror"
	"recipe-scale/backend/internal/service"
	"recipe-scale/backend/internal/validation"
)

type CustomUnitHandler struct {
	cuService *service.CustomUnitService
}

func NewCustomUnitHandler(cuService *service.CustomUnitService) *CustomUnitHandler {
	return &CustomUnitHandler{cuService: cuService}
}

func (h *CustomUnitHandler) List(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return apperror.Unauthorized("unauthorized", nil)
	}

	list, err := h.cuService.List(workspaceID)
	if err != nil {
		return apperror.Internal("terjadi kesalahan internal", err)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"customUnits": list,
		},
	})
}

func (h *CustomUnitHandler) Create(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return apperror.Unauthorized("unauthorized", nil)
	}

	var req service.CreateCustomUnitRequest
	if err := c.BodyParser(&req); err != nil {
		return apperror.BadRequest("cannot parse request body", err)
	}
	if err := validation.ValidateRequest(&req); err != nil {
		return apperror.BadRequest(err.Error(), nil)
	}

	cu, err := h.cuService.Create(workspaceID, req)
	if err != nil {
		return apperror.BadRequest(err.Error(), err)
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"customUnit": cu,
		},
	})
}

func (h *CustomUnitHandler) Delete(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return apperror.Unauthorized("unauthorized", nil)
	}

	id := c.Params("id")
	if id == "" {
		return apperror.BadRequest("id is required", nil)
	}

	if err := h.cuService.Delete(workspaceID, id); err != nil {
		return apperror.BadRequest(err.Error(), err)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "custom unit deleted successfully",
	})
}
