package service

import (
	"errors"
	"time"

	"github.com/google/uuid"

	"recipe-scale/backend/internal/domain"
	"recipe-scale/backend/internal/repository"
)

type IngredientService struct {
	ingredientRepo *repository.IngredientRepository
}

func NewIngredientService(ingredientRepo *repository.IngredientRepository) *IngredientService {
	return &IngredientService{ingredientRepo: ingredientRepo}
}

type CreateIngredientRequest struct {
	Name         string  `json:"name"`
	Unit         string  `json:"unit"`
	PricePerUnit float64 `json:"pricePerUnit"`
}

type UpdateIngredientRequest struct {
	Name         string  `json:"name"`
	Unit         string  `json:"unit"`
	PricePerUnit float64 `json:"pricePerUnit"`
}

func (s *IngredientService) CreateIngredient(workspaceID string, req CreateIngredientRequest) (*domain.Ingredient, error) {
	if req.Name == "" || req.Unit == "" || req.PricePerUnit < 0 {
		return nil, errors.New("invalid ingredient payload: name, unit, and non-negative price are required")
	}

	ing := &domain.Ingredient{
		ID:           uuid.New().String(),
		Name:         req.Name,
		Unit:         req.Unit,
		PricePerUnit: req.PricePerUnit,
		WorkspaceID:  workspaceID,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := s.ingredientRepo.Create(ing); err != nil {
		return nil, err
	}

	// Log initial price in history
	ph := &domain.PriceHistory{
		ID:           uuid.New().String(),
		IngredientID: ing.ID,
		PricePerUnit: ing.PricePerUnit,
		RecordedAt:   time.Now(),
	}
	_ = s.ingredientRepo.CreatePriceHistory(ph)

	return ing, nil
}

func (s *IngredientService) ListIngredients(workspaceID string) ([]domain.Ingredient, error) {
	return s.ingredientRepo.List(workspaceID)
}

func (s *IngredientService) UpdateIngredient(id string, workspaceID string, req UpdateIngredientRequest) (*domain.Ingredient, error) {
	ing, err := s.ingredientRepo.GetByID(id, workspaceID)
	if err != nil {
		return nil, errors.New("ingredient not found")
	}

	priceChanged := req.PricePerUnit >= 0 && req.PricePerUnit != ing.PricePerUnit

	if req.Name != "" {
		ing.Name = req.Name
	}
	if req.Unit != "" {
		ing.Unit = req.Unit
	}
	if req.PricePerUnit >= 0 {
		ing.PricePerUnit = req.PricePerUnit
	}
	ing.UpdatedAt = time.Now()

	if err := s.ingredientRepo.Update(ing); err != nil {
		return nil, err
	}

	if priceChanged {
		ph := &domain.PriceHistory{
			ID:           uuid.New().String(),
			IngredientID: ing.ID,
			PricePerUnit: ing.PricePerUnit,
			RecordedAt:   time.Now(),
		}
		_ = s.ingredientRepo.CreatePriceHistory(ph)
	}

	return ing, nil
}

func (s *IngredientService) GetIngredientPriceHistory(id string, workspaceID string) ([]domain.PriceHistory, error) {
	_, err := s.ingredientRepo.GetByID(id, workspaceID)
	if err != nil {
		return nil, errors.New("ingredient not found")
	}
	return s.ingredientRepo.GetPriceHistory(id)
}

func (s *IngredientService) DeleteIngredient(id string, workspaceID string) error {
	used, err := s.ingredientRepo.IsUsed(id)
	if err != nil {
		return err
	}
	if used {
		return errors.New("cannot delete ingredient because it is currently used in one or more recipes")
	}
	return s.ingredientRepo.Delete(id, workspaceID)
}
