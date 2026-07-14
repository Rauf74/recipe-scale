package domain

type CustomUnit struct {
	ID               string  `json:"id" gorm:"type:varchar(191);primaryKey"`
	WorkspaceID      string  `json:"workspaceId" gorm:"type:varchar(191);index"`
	Name             string  `json:"name"`
	BaseUnit         string  `json:"baseUnit"` // g, kg, ml, L, pcs
	ConversionFactor float64 `json:"conversionFactor" gorm:"type:decimal(15,4)"`
}
