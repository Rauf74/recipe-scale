package handler

import (
	"github.com/gofiber/fiber/v2"

	"recipe-scale/backend/internal/apperror"
	"recipe-scale/backend/internal/service"
	"recipe-scale/backend/internal/validation"
)

type IngredientHandler struct {
	ingredientService *service.IngredientService
}

func NewIngredientHandler(ingredientService *service.IngredientService) *IngredientHandler {
	return &IngredientHandler{ingredientService: ingredientService}
}

func (h *IngredientHandler) Create(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return apperror.Unauthorized("unauthorized", nil)
	}

	var req service.CreateIngredientRequest
	if err := c.BodyParser(&req); err != nil {
		return apperror.BadRequest("invalid request body", err)
	}
	if err := validation.ValidateRequest(&req); err != nil {
		return apperror.BadRequest(err.Error(), nil)
	}

	ing, err := h.ingredientService.CreateIngredient(workspaceID, req)
	if err != nil {
		return apperror.BadRequest(err.Error(), err)
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"ingredient": ing,
		},
	})
}

func (h *IngredientHandler) List(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return apperror.Unauthorized("unauthorized", nil)
	}

	ingredients, err := h.ingredientService.ListIngredients(workspaceID)
	if err != nil {
		return apperror.Internal("gagal memuat daftar bahan", err)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"ingredients": ingredients,
		},
	})
}

func (h *IngredientHandler) Update(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return apperror.Unauthorized("unauthorized", nil)
	}

	id := c.Params("id")
	if id == "" {
		return apperror.BadRequest("missing ingredient ID", nil)
	}

	var req service.UpdateIngredientRequest
	if err := c.BodyParser(&req); err != nil {
		return apperror.BadRequest("invalid request body", err)
	}
	if err := validation.ValidateRequest(&req); err != nil {
		return apperror.BadRequest(err.Error(), nil)
	}

	ing, err := h.ingredientService.UpdateIngredient(id, workspaceID, req)
	if err != nil {
		return apperror.BadRequest(err.Error(), err)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"ingredient": ing,
		},
	})
}

func (h *IngredientHandler) Delete(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return apperror.Unauthorized("unauthorized", nil)
	}

	id := c.Params("id")
	if id == "" {
		return apperror.BadRequest("missing ingredient ID", nil)
	}

	err := h.ingredientService.DeleteIngredient(id, workspaceID)
	if err != nil {
		return apperror.BadRequest(err.Error(), err)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "ingredient deleted successfully",
	})
}

func (h *IngredientHandler) GetPriceHistory(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return apperror.Unauthorized("unauthorized", nil)
	}

	id := c.Params("id")
	if id == "" {
		return apperror.BadRequest("missing ingredient ID", nil)
	}

	histories, err := h.ingredientService.GetIngredientPriceHistory(id, workspaceID)
	if err != nil {
		return apperror.BadRequest(err.Error(), err)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"histories": histories,
		},
	})
}

func (h *IngredientHandler) AdjustStock(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return apperror.Unauthorized("unauthorized", nil)
	}

	var req service.AdjustStockRequest
	if err := c.BodyParser(&req); err != nil {
		return apperror.BadRequest("invalid request body", err)
	}
	if err := validation.ValidateRequest(&req); err != nil {
		return apperror.BadRequest(err.Error(), nil)
	}
	ingredient, err := h.ingredientService.AdjustStock(c.Params("id"), workspaceID, req)
	if err != nil {
		return apperror.BadRequest(err.Error(), err)
	}
	return c.JSON(fiber.Map{"success": true, "data": fiber.Map{"ingredient": ingredient}})
}

func (h *IngredientHandler) ListStockMovements(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return apperror.Unauthorized("unauthorized", nil)
	}
	movements, err := h.ingredientService.ListStockMovements(workspaceID)
	if err != nil {
		return apperror.Internal("gagal memuat mutasi stok", err)
	}
	return c.JSON(fiber.Map{"success": true, "data": fiber.Map{"movements": movements}})
}
