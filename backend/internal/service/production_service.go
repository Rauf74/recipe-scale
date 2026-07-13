package service

import (
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"

	"recipe-scale/backend/internal/domain"
	"recipe-scale/backend/internal/repository"
)

type ProductionService struct {
	productionRepo *repository.ProductionRepository
	recipeRepo     *repository.RecipeRepository
	recipeService  *RecipeService
}

type CreateProductionBatchRequest struct {
	RecipeID    string  `json:"recipeId"`
	TargetYield float64 `json:"targetYield"`
	Notes       string  `json:"notes"`
}

type materialRequirement struct {
	IngredientID   string
	IngredientName string
	Quantity       float64
	Unit           string
	EstimatedCost  float64
}

func NewProductionService(productionRepo *repository.ProductionRepository, recipeRepo *repository.RecipeRepository, recipeService *RecipeService) *ProductionService {
	return &ProductionService{productionRepo: productionRepo, recipeRepo: recipeRepo, recipeService: recipeService}
}

func (s *ProductionService) CreateBatch(workspaceID string, req CreateProductionBatchRequest) (*domain.ProductionBatch, error) {
	if req.RecipeID == "" || req.TargetYield <= 0 {
		return nil, errors.New("recipeId and a positive targetYield are required")
	}
	recipe, err := s.recipeRepo.GetByID(req.RecipeID, workspaceID)
	if err != nil {
		return nil, errors.New("recipe not found")
	}
	recipe.NormalizeType()
	if recipe.RecipeType != "MENU" {
		return nil, errors.New("only menu recipes can be scheduled for production")
	}

	requirements := make(map[string]*materialRequirement)
	multiplier := req.TargetYield / recipe.YieldQuantity
	if err := s.collectMaterials(recipe, multiplier, workspaceID, requirements); err != nil {
		return nil, err
	}
	cost, err := s.recipeService.GetRecipeCost(recipe.ID, workspaceID)
	if err != nil {
		return nil, err
	}

	batchID := uuid.NewString()
	items := make([]domain.ProductionBatchItem, 0, len(requirements))
	for _, requirement := range requirements {
		items = append(items, domain.ProductionBatchItem{
			ID:             uuid.NewString(),
			BatchID:        batchID,
			IngredientID:   requirement.IngredientID,
			IngredientName: requirement.IngredientName,
			Quantity:       requirement.Quantity,
			Unit:           requirement.Unit,
			EstimatedCost:  requirement.EstimatedCost,
		})
	}

	batch := &domain.ProductionBatch{
		ID:            batchID,
		WorkspaceID:   workspaceID,
		RecipeID:      recipe.ID,
		TargetYield:   req.TargetYield,
		YieldUnit:     recipe.YieldUnit,
		Status:        "PLANNED",
		Notes:         strings.TrimSpace(req.Notes),
		EstimatedCost: cost.TotalCost * multiplier,
		Items:         items,
		CreatedAt:     time.Now(),
	}
	if err := s.productionRepo.Create(batch); err != nil {
		return nil, err
	}
	return batch, nil
}

func (s *ProductionService) collectMaterials(recipe *domain.Recipe, multiplier float64, workspaceID string, requirements map[string]*materialRequirement) error {
	for _, item := range recipe.Items {
		if item.IngredientID != nil && item.Ingredient != nil {
			quantity := convertQuantity(item.Quantity*multiplier, item.Unit, item.Ingredient.Unit)
			requirement, found := requirements[*item.IngredientID]
			if !found {
				requirement = &materialRequirement{IngredientID: *item.IngredientID, IngredientName: item.Ingredient.Name, Unit: item.Ingredient.Unit}
				requirements[*item.IngredientID] = requirement
			}
			requirement.Quantity += quantity
			requirement.EstimatedCost += quantity * item.Ingredient.PricePerUnit
			continue
		}
		if item.SubRecipeID == nil {
			return errors.New("recipe contains an invalid component")
		}

		subRecipe, err := s.recipeRepo.GetByID(*item.SubRecipeID, workspaceID)
		if err != nil {
			return errors.New("a prep component could not be found")
		}
		if subRecipe.YieldQuantity <= 0 {
			return errors.New("a prep component has an invalid yield")
		}
		subMultiplier := convertQuantity(item.Quantity*multiplier, item.Unit, subRecipe.YieldUnit) / subRecipe.YieldQuantity
		if err := s.collectMaterials(subRecipe, subMultiplier, workspaceID, requirements); err != nil {
			return err
		}
	}
	return nil
}

func (s *ProductionService) ListBatches(workspaceID string) ([]domain.ProductionBatch, error) {
	return s.productionRepo.List(workspaceID)
}

func (s *ProductionService) CompleteBatch(id string, workspaceID string) (*domain.ProductionBatch, error) {
	return s.productionRepo.Complete(id, workspaceID)
}
