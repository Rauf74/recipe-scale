package domain

import "time"

type Recipe struct {
	ID             string       `json:"id" gorm:"type:varchar(191);primaryKey"`
	Name           string       `json:"name"`
	YieldQuantity  float64      `json:"yieldQuantity"`
	YieldUnit      string       `json:"yieldUnit"`                                       // e.g. "porsi", "kg", "gram"
	RecipeType     string       `json:"recipeType" gorm:"type:varchar(16);default:MENU"` // PREP or MENU
	IsBaseRecipe   bool         `json:"isBaseRecipe"`
	SellingPrice   float64      `json:"sellingPrice" gorm:"type:decimal(15,2);default:0"`
	TargetFoodCost float64      `json:"targetFoodCost" gorm:"type:decimal(5,2);default:30"`
	PackagingCost  float64      `json:"packagingCost" gorm:"type:decimal(15,2);default:0"` // Biaya kemasan per batch
	OverheadCost   float64      `json:"overheadCost" gorm:"type:decimal(15,2);default:0"`  // Biaya overhead per batch
	WorkspaceID    string       `json:"workspaceId" gorm:"type:varchar(191);index"`
	Items          []RecipeItem `json:"items" gorm:"foreignKey:RecipeID;constraint:OnDelete:CASCADE"`
	CreatedAt      time.Time    `json:"createdAt"`
	UpdatedAt      time.Time    `json:"updatedAt"`
}

func (r *Recipe) NormalizeType() {
	if r.RecipeType == "" {
		if r.IsBaseRecipe {
			r.RecipeType = "PREP"
		} else {
			r.RecipeType = "MENU"
		}
	}
	r.IsBaseRecipe = r.RecipeType == "PREP"
}

type ProductionBatch struct {
	ID            string                `json:"id" gorm:"type:varchar(191);primaryKey"`
	WorkspaceID   string                `json:"workspaceId" gorm:"type:varchar(191);index"`
	RecipeID      string                `json:"recipeId" gorm:"type:varchar(191);index"`
	Recipe        *Recipe               `json:"recipe,omitempty" gorm:"foreignKey:RecipeID"`
	TargetYield   float64               `json:"targetYield"`
	YieldUnit     string                `json:"yieldUnit"`
	Status        string                `json:"status" gorm:"type:varchar(16);default:PLANNED"` // PLANNED or COMPLETED
	Notes         string                `json:"notes" gorm:"type:text"`
	EstimatedCost float64               `json:"estimatedCost" gorm:"type:decimal(15,2)"`
	Items         []ProductionBatchItem `json:"items" gorm:"foreignKey:BatchID;constraint:OnDelete:CASCADE"`
	CreatedAt     time.Time             `json:"createdAt"`
	CompletedAt   *time.Time            `json:"completedAt,omitempty"`
}

type ProductionBatchItem struct {
	ID             string  `json:"id" gorm:"type:varchar(191);primaryKey"`
	BatchID        string  `json:"batchId" gorm:"type:varchar(191);index"`
	IngredientID   string  `json:"ingredientId" gorm:"type:varchar(191);index"`
	IngredientName string  `json:"ingredientName"`
	Quantity       float64 `json:"quantity"`
	Unit           string  `json:"unit"`
	EstimatedCost  float64 `json:"estimatedCost" gorm:"type:decimal(15,2)"`
}

type RecipeItem struct {
	ID           string      `json:"id" gorm:"type:varchar(191);primaryKey"`
	RecipeID     string      `json:"recipeId" gorm:"type:varchar(191);index"`
	IngredientID *string     `json:"ingredientId,omitempty" gorm:"type:varchar(191)"` // Nullable if it is a sub-recipe
	SubRecipeID  *string     `json:"subRecipeId,omitempty" gorm:"type:varchar(191)"`  // Nullable if it is a raw ingredient
	Quantity     float64     `json:"quantity"`
	Unit         string      `json:"unit"`
	Ingredient   *Ingredient `json:"ingredient,omitempty" gorm:"foreignKey:IngredientID"`
	SubRecipe    *Recipe     `json:"subRecipe,omitempty" gorm:"foreignKey:SubRecipeID"`
}
