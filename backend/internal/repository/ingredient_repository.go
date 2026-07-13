package repository

import (
	"gorm.io/gorm"
	"recipe-scale/backend/internal/domain"
)

type IngredientRepository struct {
	db *gorm.DB
}

func NewIngredientRepository(db *gorm.DB) *IngredientRepository {
	return &IngredientRepository{db: db}
}

func (r *IngredientRepository) Create(i *domain.Ingredient) error {
	return r.db.Create(i).Error
}

func (r *IngredientRepository) List(workspaceID string) ([]domain.Ingredient, error) {
	var ingredients []domain.Ingredient
	err := r.db.Where("workspace_id = ?", workspaceID).Order("name asc").Find(&ingredients).Error
	return ingredients, err
}

func (r *IngredientRepository) GetByID(id string, workspaceID string) (*domain.Ingredient, error) {
	var i domain.Ingredient
	err := r.db.First(&i, "id = ? AND workspace_id = ?", id, workspaceID).Error
	if err != nil {
		return nil, err
	}
	return &i, nil
}

func (r *IngredientRepository) Update(i *domain.Ingredient) error {
	return r.db.Save(i).Error
}

func (r *IngredientRepository) Delete(id string, workspaceID string) error {
	return r.db.Delete(&domain.Ingredient{}, "id = ? AND workspace_id = ?", id, workspaceID).Error
}

func (r *IngredientRepository) IsUsed(id string) (bool, error) {
	var count int64
	err := r.db.Model(&domain.RecipeItem{}).Where("ingredient_id = ?", id).Count(&count).Error
	return count > 0, err
}

func (r *IngredientRepository) CreatePriceHistory(ph *domain.PriceHistory) error {
	return r.db.Create(ph).Error
}

func (r *IngredientRepository) GetPriceHistory(ingredientID string) ([]domain.PriceHistory, error) {
	var histories []domain.PriceHistory
	err := r.db.Where("ingredient_id = ?", ingredientID).Order("recorded_at desc").Find(&histories).Error
	return histories, err
}
