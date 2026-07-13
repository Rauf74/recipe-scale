package domain

import "time"

type Ingredient struct {
	ID           string    `json:"id" gorm:"type:varchar(191);primaryKey"`
	Name         string    `json:"name"`
	Unit         string    `json:"unit"` // e.g., "g", "kg", "ml", "L", "pcs"
	PricePerUnit float64   `json:"pricePerUnit"`
	CurrentStock float64   `json:"currentStock" gorm:"default:0"`
	ReorderPoint float64   `json:"reorderPoint" gorm:"default:0"`
	WorkspaceID  string    `json:"workspaceId" gorm:"type:varchar(191)"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type StockMovement struct {
	ID           string    `json:"id" gorm:"type:varchar(191);primaryKey"`
	IngredientID string    `json:"ingredientId" gorm:"type:varchar(191);index"`
	WorkspaceID  string    `json:"workspaceId" gorm:"type:varchar(191);index"`
	Quantity     float64   `json:"quantity"`
	Type         string    `json:"type" gorm:"type:varchar(32)"` // IN, ADJUSTMENT, PRODUCTION_OUT
	Note         string    `json:"note"`
	ReferenceID  string    `json:"referenceId,omitempty" gorm:"type:varchar(191);index"`
	CreatedAt    time.Time `json:"createdAt"`
}

type PriceHistory struct {
	ID           string    `json:"id" gorm:"type:varchar(191);primaryKey"`
	IngredientID string    `json:"ingredientId" gorm:"type:varchar(191);index"`
	PricePerUnit float64   `json:"pricePerUnit"`
	RecordedAt   time.Time `json:"recordedAt"`
}
