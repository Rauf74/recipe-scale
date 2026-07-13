package domain

import "time"

type Ingredient struct {
	ID           string    `json:"id" gorm:"type:varchar(191);primaryKey"`
	Name         string    `json:"name"`
	Unit         string    `json:"unit"` // e.g., "g", "kg", "ml", "L", "pcs"
	PricePerUnit float64   `json:"pricePerUnit"`
	WorkspaceID  string    `json:"workspaceId" gorm:"type:varchar(191)"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type PriceHistory struct {
	ID           string    `json:"id" gorm:"type:varchar(191);primaryKey"`
	IngredientID string    `json:"ingredientId" gorm:"type:varchar(191);index"`
	PricePerUnit float64   `json:"pricePerUnit"`
	RecordedAt   time.Time `json:"recordedAt"`
}
