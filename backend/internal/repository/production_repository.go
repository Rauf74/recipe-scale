package repository

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"recipe-scale/backend/internal/domain"
)

type ProductionRepository struct {
	db *gorm.DB
}

func NewProductionRepository(db *gorm.DB) *ProductionRepository {
	return &ProductionRepository{db: db}
}

func (r *ProductionRepository) Create(batch *domain.ProductionBatch) error {
	return r.db.Create(batch).Error
}

func (r *ProductionRepository) List(workspaceID string) ([]domain.ProductionBatch, error) {
	var batches []domain.ProductionBatch
	err := r.db.Where("workspace_id = ?", workspaceID).Preload("Recipe").Preload("Items").Order("created_at desc").Find(&batches).Error
	return batches, err
}

func (r *ProductionRepository) Complete(id string, workspaceID string) (*domain.ProductionBatch, error) {
	var completed domain.ProductionBatch
	err := r.db.Transaction(func(tx *gorm.DB) error {
		var batch domain.ProductionBatch
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ? AND workspace_id = ?", id, workspaceID).
			Preload("Items").First(&batch).Error; err != nil {
			return err
		}
		if batch.Status == "COMPLETED" {
			return errors.New("production batch has already been completed")
		}

		for _, item := range batch.Items {
			var ingredient domain.Ingredient
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&ingredient, "id = ? AND workspace_id = ?", item.IngredientID, workspaceID).Error; err != nil {
				return errors.New("an ingredient in this batch is no longer available")
			}
			if ingredient.CurrentStock < item.Quantity {
				return errors.New("insufficient stock for " + ingredient.Name)
			}
			ingredient.CurrentStock -= item.Quantity
			ingredient.UpdatedAt = time.Now()
			if err := tx.Save(&ingredient).Error; err != nil {
				return err
			}
			movement := domain.StockMovement{
				ID:           uuid.NewString(),
				IngredientID: ingredient.ID,
				WorkspaceID:  workspaceID,
				Quantity:     -item.Quantity,
				Type:         "PRODUCTION_OUT",
				Note:         "Pemakaian batch produksi",
				ReferenceID:  batch.ID,
				CreatedAt:    time.Now(),
			}
			if err := tx.Create(&movement).Error; err != nil {
				return err
			}
		}

		now := time.Now()
		batch.Status = "COMPLETED"
		batch.CompletedAt = &now
		if err := tx.Save(&batch).Error; err != nil {
			return err
		}
		completed = batch
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &completed, nil
}
