package handler

import (
	"math"

	"github.com/gofiber/fiber/v2"

	"recipe-scale/backend/internal/service"
)

type AnalyticsHandler struct {
	recipeService *service.RecipeService
}

func NewAnalyticsHandler(recipeService *service.RecipeService) *AnalyticsHandler {
	return &AnalyticsHandler{recipeService: recipeService}
}

func (h *AnalyticsHandler) MenuPerformance(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	recipes, err := h.recipeService.ListRecipes(workspaceID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	performance := make([]fiber.Map, 0)
	for _, recipe := range recipes {
		recipe.NormalizeType()
		if recipe.RecipeType != "MENU" {
			continue
		}
		cost, err := h.recipeService.GetRecipeCost(recipe.ID, workspaceID)
		if err != nil {
			continue
		}
		foodCost := 0.0
		margin := 0.0
		if recipe.SellingPrice > 0 {
			foodCost = (cost.UnitCost / recipe.SellingPrice) * 100
			margin = recipe.SellingPrice - cost.UnitCost
		}
		performance = append(performance, fiber.Map{
			"recipe":          recipe,
			"unitCost":        math.Round(cost.UnitCost*100) / 100,
			"sellingPrice":    recipe.SellingPrice,
			"foodCostPercent": math.Round(foodCost*10) / 10,
			"margin":          math.Round(margin*100) / 100,
			"hasSellingPrice": recipe.SellingPrice > 0,
		})
	}

	return c.JSON(fiber.Map{"success": true, "data": fiber.Map{"menus": performance}})
}
