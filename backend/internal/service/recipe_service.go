package service

import (
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"

	"recipe-scale/backend/internal/domain"
	"recipe-scale/backend/internal/repository"
)

type RecipeService struct {
	recipeRepo     *repository.RecipeRepository
	ingredientRepo *repository.IngredientRepository
}

func NewRecipeService(recipeRepo *repository.RecipeRepository, ingredientRepo *repository.IngredientRepository) *RecipeService {
	return &RecipeService{
		recipeRepo:     recipeRepo,
		ingredientRepo: ingredientRepo,
	}
}

type RecipeItemRequest struct {
	IngredientID *string `json:"ingredientId"`
	SubRecipeID  *string `json:"subRecipeId"`
	Quantity     float64 `json:"quantity"`
	Unit         string  `json:"unit"`
}

type CreateRecipeRequest struct {
	Name           string              `json:"name"`
	YieldQuantity  float64             `json:"yieldQuantity"`
	YieldUnit      string              `json:"yieldUnit"`
	IsBaseRecipe   bool                `json:"isBaseRecipe"`
	SellingPrice   float64             `json:"sellingPrice"`
	TargetFoodCost float64             `json:"targetFoodCost"`
	Items          []RecipeItemRequest `json:"items"`
}

type RecipeCostResponse struct {
	Recipe    *domain.Recipe     `json:"recipe"`
	TotalCost float64            `json:"totalCost"`
	UnitCost  float64            `json:"unitCost"`
	ItemCosts map[string]float64 `json:"itemCosts"`
}

func (s *RecipeService) detectCycle(parentRecipeID string, subRecipeID string, workspaceID string) bool {
	if parentRecipeID == subRecipeID {
		return true
	}

	subRecipe, err := s.recipeRepo.GetByID(subRecipeID, workspaceID)
	if err != nil {
		return false
	}

	for _, item := range subRecipe.Items {
		if item.SubRecipeID != nil {
			if s.detectCycle(parentRecipeID, *item.SubRecipeID, workspaceID) {
				return true
			}
		}
	}
	return false
}

func (s *RecipeService) validateItems(recipeID string, workspaceID string, reqItems []RecipeItemRequest) error {
	for _, item := range reqItems {
		// 1. XOR validation: exactly one of IngredientID or SubRecipeID must be set
		if (item.IngredientID == nil && item.SubRecipeID == nil) || (item.IngredientID != nil && item.SubRecipeID != nil) {
			return errors.New("each recipe item must reference exactly one raw ingredient or sub-recipe")
		}

		// 2. Quantity validation
		if item.Quantity <= 0 {
			return errors.New("quantity must be greater than zero")
		}

		// 3. Tenant validation
		if item.IngredientID != nil {
			ing, err := s.ingredientRepo.GetByID(*item.IngredientID, workspaceID)
			if err != nil || ing.WorkspaceID != workspaceID {
				return errors.New("unauthorized reference: ingredient belongs to a different workspace or does not exist")
			}
		}

		if item.SubRecipeID != nil {
			sub, err := s.recipeRepo.GetByID(*item.SubRecipeID, workspaceID)
			if err != nil || sub.WorkspaceID != workspaceID {
				return errors.New("unauthorized reference: sub-recipe belongs to a different workspace or does not exist")
			}

			// 4. Cycle detection check
			if s.detectCycle(recipeID, *item.SubRecipeID, workspaceID) {
				return errors.New("circular dependency detected: adding this sub-recipe creates a cyclic loop")
			}
		}
	}
	return nil
}

func (s *RecipeService) CreateRecipe(workspaceID string, req CreateRecipeRequest) (*domain.Recipe, error) {
	if req.Name == "" || req.YieldQuantity <= 0 || req.YieldUnit == "" || len(req.Items) == 0 {
		return nil, errors.New("invalid recipe payload: name, yieldQuantity, and items are required")
	}

	recipeID := uuid.New().String()

	// Perform validation guards
	if err := s.validateItems(recipeID, workspaceID, req.Items); err != nil {
		return nil, err
	}

	items := make([]domain.RecipeItem, len(req.Items))
	for i, item := range req.Items {
		items[i] = domain.RecipeItem{
			ID:           uuid.New().String(),
			RecipeID:     recipeID,
			IngredientID: item.IngredientID,
			SubRecipeID:  item.SubRecipeID,
			Quantity:     item.Quantity,
			Unit:         item.Unit,
		}
	}

	recipe := &domain.Recipe{
		ID:            recipeID,
		Name:          req.Name,
		YieldQuantity: req.YieldQuantity,
		YieldUnit:     req.YieldUnit,
		IsBaseRecipe:  req.IsBaseRecipe,
		SellingPrice:  req.SellingPrice,
		TargetFoodCost: req.TargetFoodCost,
		WorkspaceID:   workspaceID,
		Items:         items,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := s.recipeRepo.Create(recipe); err != nil {
		return nil, err
	}

	return s.recipeRepo.GetByID(recipeID, workspaceID)
}

func (s *RecipeService) ListRecipes(workspaceID string) ([]domain.Recipe, error) {
	return s.recipeRepo.List(workspaceID)
}

func (s *RecipeService) GetRecipe(id string, workspaceID string) (*domain.Recipe, error) {
	return s.recipeRepo.GetByID(id, workspaceID)
}

func (s *RecipeService) UpdateRecipe(id string, workspaceID string, req CreateRecipeRequest) (*domain.Recipe, error) {
	recipe, err := s.recipeRepo.GetByID(id, workspaceID)
	if err != nil {
		return nil, errors.New("recipe not found")
	}

	// Perform validation guards
	if err := s.validateItems(recipe.ID, workspaceID, req.Items); err != nil {
		return nil, err
	}

	recipe.Name = req.Name
	recipe.YieldQuantity = req.YieldQuantity
	recipe.YieldUnit = req.YieldUnit
	recipe.IsBaseRecipe = req.IsBaseRecipe
	recipe.SellingPrice = req.SellingPrice
	recipe.TargetFoodCost = req.TargetFoodCost
	recipe.UpdatedAt = time.Now()

	newItems := make([]domain.RecipeItem, len(req.Items))
	for i, item := range req.Items {
		newItems[i] = domain.RecipeItem{
			ID:           uuid.New().String(),
			RecipeID:     recipe.ID,
			IngredientID: item.IngredientID,
			SubRecipeID:  item.SubRecipeID,
			Quantity:     item.Quantity,
			Unit:         item.Unit,
		}
	}
	recipe.Items = newItems

	if err := s.recipeRepo.Update(recipe); err != nil {
		return nil, err
	}

	return s.recipeRepo.GetByID(recipe.ID, workspaceID)
}

func (s *RecipeService) DeleteRecipe(id string, workspaceID string) error {
	used, err := s.recipeRepo.IsUsed(id)
	if err != nil {
		return err
	}
	if used {
		return errors.New("cannot delete base recipe because it is currently used as a bumbu dasar in other recipes")
	}
	return s.recipeRepo.Delete(id, workspaceID)
}

// GetRecipeCost calculates the total cost of a recipe and its unit cost recursively
func (s *RecipeService) GetRecipeCost(id string, workspaceID string) (*RecipeCostResponse, error) {
	recipe, err := s.recipeRepo.GetByID(id, workspaceID)
	if err != nil {
		return nil, errors.New("recipe not found")
	}

	itemCosts := make(map[string]float64)
	totalCost := s.calculateCostRecursiveWithBreakdown(recipe, workspaceID, itemCosts)
	unitCost := 0.0
	if recipe.YieldQuantity > 0 {
		unitCost = totalCost / recipe.YieldQuantity
	}

	return &RecipeCostResponse{
		Recipe:    recipe,
		TotalCost: totalCost,
		UnitCost:  unitCost,
		ItemCosts: itemCosts,
	}, nil
}

func (s *RecipeService) calculateCostRecursive(recipe *domain.Recipe, workspaceID string) float64 {
	total := 0.0

	for _, item := range recipe.Items {
		if item.IngredientID != nil && item.Ingredient != nil {
			// 1. Raw Ingredient Cost
			// Convert item quantity unit to ingredient base price unit
			adjustedQty := convertQuantity(item.Quantity, item.Unit, item.Ingredient.Unit)
			total += adjustedQty * item.Ingredient.PricePerUnit
		} else if item.SubRecipeID != nil && item.SubRecipe != nil {
			// 2. Nested Sub-Recipe Cost
			// Calculate the total cost of the sub-recipe recursively
			subRecipeTotalCost := s.calculateCostRecursive(item.SubRecipe, workspaceID)
			
			// Adjust sub-recipe quantity based on unit matches
			adjustedSubRecipeQty := convertQuantity(item.Quantity, item.Unit, item.SubRecipe.YieldUnit)
			
			if item.SubRecipe.YieldQuantity > 0 {
				unitCost := subRecipeTotalCost / item.SubRecipe.YieldQuantity
				total += unitCost * adjustedSubRecipeQty
			}
		}
	}

	return total
}

func (s *RecipeService) calculateCostRecursiveWithBreakdown(recipe *domain.Recipe, workspaceID string, itemCosts map[string]float64) float64 {
	total := 0.0

	for _, item := range recipe.Items {
		itemCost := 0.0
		if item.IngredientID != nil && item.Ingredient != nil {
			adjustedQty := convertQuantity(item.Quantity, item.Unit, item.Ingredient.Unit)
			itemCost = adjustedQty * item.Ingredient.PricePerUnit
		} else if item.SubRecipeID != nil && item.SubRecipe != nil {
			subRecipeTotalCost := s.calculateCostRecursive(item.SubRecipe, workspaceID)
			adjustedSubRecipeQty := convertQuantity(item.Quantity, item.Unit, item.SubRecipe.YieldUnit)
			if item.SubRecipe.YieldQuantity > 0 {
				unitCost := subRecipeTotalCost / item.SubRecipe.YieldQuantity
				itemCost = unitCost * adjustedSubRecipeQty
			}
		}
		total += itemCost
		itemCosts[item.ID] = itemCost
	}

	return total
}

// Unit conversion helper
func convertQuantity(qty float64, fromUnit, toUnit string) float64 {
	from := strings.ToLower(strings.TrimSpace(fromUnit))
	to := strings.ToLower(strings.TrimSpace(toUnit))

	if from == to {
		return qty
	}

	// Mass Conversions
	if from == "g" && to == "kg" {
		return qty / 1000.0
	}
	if from == "kg" && to == "g" {
		return qty * 1000.0
	}

	// Volume Conversions
	if from == "ml" && to == "l" {
		return qty / 1000.0
	}
	if from == "l" && to == "ml" {
		return qty * 1000.0
	}

	return qty
}
