package domain

import "time"

type Ingredient struct {
	ID          string    `json:"id" gorm:"type:varchar(191);primaryKey"`
	Name        string    `json:"name"`
	WorkspaceID string    `json:"workspaceId" gorm:"type:varchar(191);index"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`

	// --- Satuan resep (dipakai saat menyusun resep) ---
	Unit string `json:"unit"` // g, kg, ml, L, pcs

	// --- Model harga pembelian (cara beli nyata di pasar) ---
	// Contoh: beli Beras 5 kg seharga Rp 75.000
	PurchasePrice    float64 `json:"purchasePrice" gorm:"type:decimal(15,2);default:0"`    // Harga total kemasan (Rp)
	PurchaseQuantity float64 `json:"purchaseQuantity" gorm:"type:decimal(15,4);default:1"` // Isi kemasan dalam satuan unit resep
	PurchaseUnit     string  `json:"purchaseUnit" gorm:"type:varchar(32);default:'unit'"`  // Label kemasan bebas: "kg", "pack", "ikat"
	UsableYield      float64 `json:"usableYield" gorm:"type:decimal(5,2);default:100"`     // % bahan yang terpakai setelah susut/trim (1–100)

	// CostPerRecipeUnit adalah NILAI TURUNAN yang dihitung server-side:
	//   costPerRecipeUnit = (purchasePrice / purchaseQuantity) / (usableYield / 100)
	// Kolom ini menjadi sumber kebenaran tunggal untuk kalkulasi HPP.
	// PricePerUnit dipertahankan sebagai alias agar recipe_service tidak perlu diubah.
	CostPerRecipeUnit float64 `json:"costPerRecipeUnit" gorm:"type:decimal(15,6);default:0"`
	PricePerUnit      float64 `json:"pricePerUnit" gorm:"type:decimal(15,6);default:0"` // = CostPerRecipeUnit (backward-compat)

	// --- Stok (diisi via StockPage, bukan form bahan baku) ---
	CurrentStock float64 `json:"currentStock" gorm:"default:0"`
	ReorderPoint float64 `json:"reorderPoint" gorm:"default:0"`
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
	ID               string    `json:"id" gorm:"type:varchar(191);primaryKey"`
	IngredientID     string    `json:"ingredientId" gorm:"type:varchar(191);index"`
	PricePerUnit     float64   `json:"pricePerUnit"`     // snapshot CostPerRecipeUnit saat itu
	PurchasePrice    float64   `json:"purchasePrice"`    // snapshot harga kemasan saat itu
	PurchaseQuantity float64   `json:"purchaseQuantity"` // snapshot isi kemasan saat itu
	PurchaseUnit     string    `json:"purchaseUnit"`     // snapshot satuan kemasan saat itu
	UsableYield      float64   `json:"usableYield"`      // snapshot susut saat itu
	RecordedAt       time.Time `json:"recordedAt"`
}
