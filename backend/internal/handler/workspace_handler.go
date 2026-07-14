package handler
import (
	"github.com/gofiber/fiber/v2"

	"recipe-scale/backend/internal/apperror"
	"recipe-scale/backend/internal/service"
	"recipe-scale/backend/internal/validation"
)

type WorkspaceHandler struct {
	workspaceService *service.WorkspaceService
}

func NewWorkspaceHandler(workspaceService *service.WorkspaceService) *WorkspaceHandler {
	return &WorkspaceHandler{
		workspaceService: workspaceService,
	}
}

func (h *WorkspaceHandler) Get(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return apperror.Unauthorized("unauthorized", nil)
	}

	ws, err := h.workspaceService.GetWorkspace(workspaceID)
	if err != nil {
		return apperror.NotFound(err.Error(), err)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"workspace": ws,
		},
	})
}

func (h *WorkspaceHandler) Update(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return apperror.Unauthorized("unauthorized", nil)
	}

	var req service.UpdateWorkspaceRequest
	if err := c.BodyParser(&req); err != nil {
		return apperror.BadRequest("cannot parse request body", err)
	}
	if err := validation.ValidateRequest(&req); err != nil {
		return apperror.BadRequest(err.Error(), nil)
	}

	ws, err := h.workspaceService.UpdateWorkspace(workspaceID, req)
	if err != nil {
		return apperror.BadRequest(err.Error(), err)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"workspace": ws,
		},
	})
}
