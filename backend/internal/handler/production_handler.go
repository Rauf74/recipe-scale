package handler

import (
	"github.com/gofiber/fiber/v2"

	"recipe-scale/backend/internal/service"
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
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	var req service.CreateProductionBatchRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	batch, err := h.productionService.CreateBatch(workspaceID, req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": fiber.Map{"batch": batch}})
}

func (h *ProductionHandler) List(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	batches, err := h.productionService.ListBatches(workspaceID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"success": true, "data": fiber.Map{"batches": batches}})
}

func (h *ProductionHandler) Complete(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	batch, err := h.productionService.CompleteBatch(c.Params("id"), workspaceID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"success": true, "data": fiber.Map{"batch": batch}})
}
