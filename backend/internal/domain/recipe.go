package domain

import "time"

type Recipe struct {
	ID            string       `json:"id" gorm:"type:varchar(191);primaryKey"`
	Name          string       `json:"name"`
	YieldQuantity float64      `json:"yieldQuantity"`
	YieldUnit     string       `json:"yieldUnit"` // e.g. "portions", "kg", "grams"
	IsBaseRecipe  bool         `json:"isBaseRecipe"`
	SellingPrice  float64      `json:"sellingPrice" gorm:"type:decimal(15,2);default:0"`
	TargetFoodCost float64     `json:"targetFoodCost" gorm:"type:decimal(5,2);default:30"`
	WorkspaceID   string       `json:"workspaceId" gorm:"type:varchar(191)"`
	Items         []RecipeItem `json:"items" gorm:"foreignKey:RecipeID;constraint:OnDelete:CASCADE"`
	CreatedAt     time.Time    `json:"createdAt"`
	UpdatedAt     time.Time    `json:"updatedAt"`
}

type RecipeItem struct {
	ID           string      `json:"id" gorm:"type:varchar(191);primaryKey"`
	RecipeID     string      `json:"recipeId" gorm:"type:varchar(191)"`
	IngredientID *string     `json:"ingredientId,omitempty" gorm:"type:varchar(191)"` // Nullable if it is a sub-recipe
	SubRecipeID  *string     `json:"subRecipeId,omitempty" gorm:"type:varchar(191)"`  // Nullable if it is a raw ingredient
	Quantity     float64     `json:"quantity"`
	Unit         string      `json:"unit"`
	Ingredient   *Ingredient `json:"ingredient,omitempty" gorm:"foreignKey:IngredientID"`
	SubRecipe    *Recipe     `json:"subRecipe,omitempty" gorm:"foreignKey:SubRecipeID"`
}
