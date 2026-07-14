package handler

import (
	"github.com/gofiber/fiber/v2"

	"recipe-scale/backend/internal/service"
	"recipe-scale/backend/internal/apperror"
)

type RecipeHandler struct {
	recipeService *service.RecipeService
}

func NewRecipeHandler(recipeService *service.RecipeService) *RecipeHandler {
	return &RecipeHandler{recipeService: recipeService}
}

func (h *RecipeHandler) Create(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	var req service.CreateRecipeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	recipe, err := h.recipeService.CreateRecipe(workspaceID, req)
	if err != nil {
	return apperror.BadRequest(err.Error(), err)
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"recipe": recipe,
		},
	})
}

func (h *RecipeHandler) List(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	recipes, err := h.recipeService.ListRecipes(workspaceID)
	if err != nil {
	return apperror.Internal("terjadi kesalahan internal", err)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"recipes": recipes,
		},
	})
}

func (h *RecipeHandler) Get(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "missing recipe ID",
		})
	}

	recipe, err := h.recipeService.GetRecipe(id, workspaceID)
	if err != nil {
	return apperror.NotFound(err.Error(), err)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"recipe": recipe,
		},
	})
}

func (h *RecipeHandler) Update(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "missing recipe ID",
		})
	}

	var req service.CreateRecipeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	recipe, err := h.recipeService.UpdateRecipe(id, workspaceID, req)
	if err != nil {
	return apperror.BadRequest(err.Error(), err)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"recipe": recipe,
		},
	})
}

func (h *RecipeHandler) Delete(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "missing recipe ID",
		})
	}

	err := h.recipeService.DeleteRecipe(id, workspaceID)
	if err != nil {
	return apperror.BadRequest(err.Error(), err)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "recipe deleted successfully",
	})
}

func (h *RecipeHandler) GetCost(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "missing recipe ID",
		})
	}

	costRes, err := h.recipeService.GetRecipeCost(id, workspaceID)
	if err != nil {
	return apperror.BadRequest(err.Error(), err)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"recipe":    costRes.Recipe,
			"totalCost": costRes.TotalCost,
			"unitCost":  costRes.UnitCost,
			"itemCosts": costRes.ItemCosts,
		},
	})
}
