package repository

import (
	"gorm.io/gorm"
	"recipe-scale/backend/internal/domain"
)

type RecipeRepository struct {
	db *gorm.DB
}

func NewRecipeRepository(db *gorm.DB) *RecipeRepository {
	return &RecipeRepository{db: db}
}

func (r *RecipeRepository) Create(recipe *domain.Recipe) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(recipe).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *RecipeRepository) List(workspaceID string) ([]domain.Recipe, error) {
	var recipes []domain.Recipe
	// Preload items and ingredients to display cost in list if needed
	err := r.db.Where("workspace_id = ?", workspaceID).
		Preload("Items.Ingredient").
		Preload("Items.SubRecipe").
		Order("name asc").Find(&recipes).Error
	for index := range recipes {
		recipes[index].NormalizeType()
	}
	return recipes, err
}

func (r *RecipeRepository) GetByID(id string, workspaceID string) (*domain.Recipe, error) {
	var recipe domain.Recipe
	// Preload nested items up to 3 levels deep (parent -> items -> sub-recipes -> sub-recipe items -> sub-recipe ingredient)
	err := r.db.Where("id = ? AND workspace_id = ?", id, workspaceID).
		Preload("Items.Ingredient").
		Preload("Items.SubRecipe.Items.Ingredient").
		First(&recipe).Error
	if err != nil {
		return nil, err
	}
	recipe.NormalizeType()
	return &recipe, nil
}

func (r *RecipeRepository) Update(recipe *domain.Recipe) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// 1. Delete existing items
		if err := tx.Delete(&domain.RecipeItem{}, "recipe_id = ?", recipe.ID).Error; err != nil {
			return err
		}
		// 2. Save recipe basic info
		if err := tx.Save(recipe).Error; err != nil {
			return err
		}
		// 3. Re-insert items
		if len(recipe.Items) > 0 {
			if err := tx.Create(&recipe.Items).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *RecipeRepository) Delete(id string, workspaceID string) error {
	return r.db.Delete(&domain.Recipe{}, "id = ? AND workspace_id = ?", id, workspaceID).Error
}

func (r *RecipeRepository) IsUsed(id string) (bool, error) {
	var count int64
	err := r.db.Model(&domain.RecipeItem{}).Where("sub_recipe_id = ?", id).Count(&count).Error
	return count > 0, err
}
