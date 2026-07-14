package handler

import (
	"github.com/gofiber/fiber/v2"

	"recipe-scale/backend/internal/apperror"
	"recipe-scale/backend/internal/service"
	"recipe-scale/backend/internal/validation"
)

type ProductionHandler struct {
	productionService *service.ProductionService
}

func NewProductionHandler(productionService *service.ProductionService) *ProductionHandler {
	return &ProductionHandler{productionService: productionService}
}

func (h *ProductionHandler) Create(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return apperror.Unauthorized("unauthorized", nil)
	}
	var req service.CreateProductionBatchRequest
	if err := c.BodyParser(&req); err != nil {
		return apperror.BadRequest("invalid request body", err)
	}
	if err := validation.ValidateRequest(&req); err != nil {
		return apperror.BadRequest(err.Error(), nil)
	}
	batch, err := h.productionService.CreateBatch(workspaceID, req)
	if err != nil {
		return apperror.BadRequest(err.Error(), err)
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": fiber.Map{"batch": batch}})
}

func (h *ProductionHandler) List(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return apperror.Unauthorized("unauthorized", nil)
	}
	batches, err := h.productionService.ListBatches(workspaceID)
	if err != nil {
		return apperror.Internal("terjadi kesalahan internal", err)
	}
	return c.JSON(fiber.Map{"success": true, "data": fiber.Map{"batches": batches}})
}

func (h *ProductionHandler) Complete(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return apperror.Unauthorized("unauthorized", nil)
	}
	batch, err := h.productionService.CompleteBatch(c.Params("id"), workspaceID)
	if err != nil {
		return apperror.BadRequest(err.Error(), err)
	}
	return c.JSON(fiber.Map{"success": true, "data": fiber.Map{"batch": batch}})
}
