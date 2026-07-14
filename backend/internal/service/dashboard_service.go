package service

import (
	"math"
	"time"

	"gorm.io/gorm"

	"recipe-scale/backend/internal/domain"
)

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
	Status                 string  `json:"status"`
}

type DashboardService struct {
	db                *gorm.DB
	recipeService     *RecipeService
	ingredientService *IngredientService
}

func NewDashboardService(db *gorm.DB, recipeService *RecipeService, ingredientService *IngredientService) *DashboardService {
	return &DashboardService{
		db:                db,
		recipeService:     recipeService,
		ingredientService: ingredientService,
	}
}

func (s *DashboardService) GetAlerts(workspaceID string) ([]PriceAlert, []MarginAlert, error) {
	ingredients, err := s.ingredientService.ListIngredients(workspaceID)
	if err != nil {
		return nil, nil, err
	}

	var priceAlerts []PriceAlert
	for _, ing := range ingredients {
		var histories []domain.PriceHistory
		err := s.db.Where("ingredient_id = ?", ing.ID).Order("recorded_at desc").Limit(2).Find(&histories).Error
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

	recipes, err := s.recipeService.ListRecipes(workspaceID)
	if err != nil {
		return nil, nil, err
	}

	var marginAlerts []MarginAlert
	for _, rec := range recipes {
		if rec.IsBaseRecipe {
			continue
		}

		costData, err := s.recipeService.GetRecipeCost(rec.ID, workspaceID)
		if err != nil || costData == nil {
			continue
		}

		unitCost := costData.UnitCost
		sellingPrice := rec.SellingPrice
		targetFoodCost := rec.TargetFoodCost
		if targetFoodCost <= 0 {
			targetFoodCost = 30
		}

		var currentFoodCostPercent float64
		if sellingPrice > 0 {
			currentFoodCostPercent = (unitCost / sellingPrice) * 100
		} else {
			currentFoodCostPercent = 0
		}

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

	return priceAlerts, marginAlerts, nil
}
