package handler

import (
	"math"
	"recipe-scale/backend/internal/apperror"
	"recipe-scale/backend/internal/domain"
	"recipe-scale/backend/internal/service"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type DashboardHandler struct {
	db                *gorm.DB
	recipeService     *service.RecipeService
	ingredientService *service.IngredientService
}

func NewDashboardHandler(db *gorm.DB, recipeService *service.RecipeService, ingredientService *service.IngredientService) *DashboardHandler {
	return &DashboardHandler{
		db:                db,
		recipeService:     recipeService,
		ingredientService: ingredientService,
	}
}

type PriceAlert struct {
	IngredientID  string    `json:"ingredientId"`
	Name          string    `json:"name"`
	CurrentPrice  float64   `json:"currentPrice"`
	PreviousPrice float64   `json:"previousPrice"`
	ChangePercent float64   `json:"changePercent"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

type MarginAlert struct {
	RecipeID               string  `json:"recipeId"`
	Name                   string  `json:"name"`
	UnitCost               float64 `json:"unitCost"`
	SellingPrice           float64 `json:"sellingPrice"`
	CurrentFoodCostPercent float64 `json:"currentFoodCostPercent"`
	TargetFoodCostPercent  float64 `json:"targetFoodCostPercent"`
	Status                 string  `json:"status"` // "danger" or "warning" or "good"
}

func (h *DashboardHandler) GetAlerts(c *fiber.Ctx) error {
	workspaceID, ok := c.Locals("workspaceId").(string)
	if !ok || workspaceID == "" {
		return apperror.Unauthorized("unauthorized", nil)
	}

	// 1. Fetch Ingredients to compute Price Alerts
	ingredients, err := h.ingredientService.ListIngredients(workspaceID)
	if err != nil {
		return apperror.Internal("terjadi kesalahan internal", err)
	}

	var priceAlerts []PriceAlert
	for _, ing := range ingredients {
		// Fetch price histories for this ingredient
		var histories []domain.PriceHistory
		err := h.db.Where("ingredient_id = ?", ing.ID).Order("recorded_at desc").Limit(2).Find(&histories).Error
		if err == nil && len(histories) >= 2 {
			currentPrice := histories[0].PricePerUnit
			previousPrice := histories[1].PricePerUnit
			if currentPrice > previousPrice && previousPrice > 0 {
				changePercent := ((currentPrice - previousPrice) / previousPrice) * 100
				priceAlerts = append(priceAlerts, PriceAlert{
					IngredientID:  ing.ID,
					Name:          ing.Name,
					CurrentPrice:  currentPrice,
					PreviousPrice: previousPrice,
					ChangePercent: math.Round(changePercent*10) / 10,
					UpdatedAt:     ing.UpdatedAt,
				})
			}
		}
	}

	// 2. Fetch Recipes to compute Margin Alerts
	recipes, err := h.recipeService.ListRecipes(workspaceID)
	if err != nil {
		return apperror.Internal("terjadi kesalahan internal", err)
	}

	var marginAlerts []MarginAlert
	for _, rec := range recipes {
		// We only trigger margin alerts for final menu items (not sub-recipes / base recipes)
		if rec.IsBaseRecipe {
			continue
		}

		// Calculate current recursive cost
		costData, err := h.recipeService.GetRecipeCost(rec.ID, workspaceID)
		if err != nil || costData == nil {
			continue
		}

		unitCost := costData.UnitCost
		sellingPrice := rec.SellingPrice
		targetFoodCost := rec.TargetFoodCost
		if targetFoodCost <= 0 {
			targetFoodCost = 30 // default 30%
		}

		var currentFoodCostPercent float64
		if sellingPrice > 0 {
			currentFoodCostPercent = (unitCost / sellingPrice) * 100
		} else {
			currentFoodCostPercent = 0
		}

		// If current food cost is higher than target, or selling price is not set, trigger alerts
		if (sellingPrice > 0 && currentFoodCostPercent > targetFoodCost) || sellingPrice == 0 {
			status := "danger"
			if sellingPrice > 0 && currentFoodCostPercent <= targetFoodCost+5 {
				status = "warning"
			}
			marginAlerts = append(marginAlerts, MarginAlert{
				RecipeID:               rec.ID,
				Name:                   rec.Name,
				UnitCost:               math.Round(unitCost),
				SellingPrice:           sellingPrice,
				CurrentFoodCostPercent: math.Round(currentFoodCostPercent*10) / 10,
				TargetFoodCostPercent:  targetFoodCost,
				Status:                 status,
			})
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"priceAlerts":  priceAlerts,
			"marginAlerts": marginAlerts,
		},
	})
}
