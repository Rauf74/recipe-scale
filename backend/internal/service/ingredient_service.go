package service

import (
	"errors"
	"strings"
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

// IngredientRequest digunakan untuk create maupun update.
// User menginput cara belanja nyata (kemasan), bukan harga per satuan resep langsung.
type IngredientRequest struct {
	Name string `json:"name" validate:"required"`
	Unit string `json:"unit" validate:"required,oneof=g kg ml L pcs"`

	// Cara beli
	PurchasePrice    float64 `json:"purchasePrice" validate:"gte=0"`
	PurchaseQuantity float64 `json:"purchaseQuantity" validate:"gt=0"`
	PurchaseUnit     string  `json:"purchaseUnit"`
	UsableYield      float64 `json:"usableYield" validate:"min=0,max=100"`

	// Stok
	ReorderPoint *float64 `json:"reorderPoint"`
}

// Alias agar handler yang pakai tipe lama tetap compile (backward-compat).
type CreateIngredientRequest = IngredientRequest
type UpdateIngredientRequest = IngredientRequest

type AdjustStockRequest struct {
	Quantity float64 `json:"quantity" validate:"required,ne=0"`
	Note     string  `json:"note"`
}

// calculateCostPerRecipeUnit menghitung biaya aktual per satuan resep dari data pembelian.
//
// Formula:
//
//	rawCost = purchasePrice / purchaseQuantity
//	costPerRecipeUnit = rawCost / (usableYield / 100)
//
// Catatan: purchaseQuantity sudah dalam satuan resep (user mengonversi kemasan ke satuan resep di frontend).
// Contoh: Beras 5 kg, satuan resep g → purchaseQuantity = 5000, purchasePrice = 75000
//
//	rawCost = 75000 / 5000 = 15 Rp/g
//	usableYield 80% → costPerRecipeUnit = 15 / 0.8 = 18.75 Rp/g
func calculateCostPerRecipeUnit(purchasePrice, purchaseQuantity, usableYield float64) float64 {
	if purchaseQuantity <= 0 {
		return 0
	}
	yield := usableYield
	if yield <= 0 || yield > 100 {
		yield = 100
	}
	rawCost := purchasePrice / purchaseQuantity
	return rawCost / (yield / 100)
}

func validateIngredientRequest(req IngredientRequest) error {
	if strings.TrimSpace(req.Name) == "" {
		return errors.New("nama bahan baku tidak boleh kosong")
	}
	if strings.TrimSpace(req.Unit) == "" {
		return errors.New("satuan resep tidak boleh kosong")
	}
	if req.PurchasePrice < 0 {
		return errors.New("harga beli tidak boleh negatif")
	}
	if req.PurchaseQuantity <= 0 {
		return errors.New("jumlah kemasan harus lebih dari nol")
	}
	if req.UsableYield != 0 && (req.UsableYield < 1 || req.UsableYield > 100) {
		return errors.New("persentase susut (usable yield) harus antara 1 dan 100")
	}
	return nil
}

func (s *IngredientService) CreateIngredient(workspaceID string, req IngredientRequest) (*domain.Ingredient, error) {
	if err := validateIngredientRequest(req); err != nil {
		return nil, err
	}

	yield := req.UsableYield
	if yield <= 0 {
		yield = 100
	}
	cost := calculateCostPerRecipeUnit(req.PurchasePrice, req.PurchaseQuantity, yield)

	ing := &domain.Ingredient{
		ID:                uuid.New().String(),
		Name:              strings.TrimSpace(req.Name),
		Unit:              strings.TrimSpace(req.Unit),
		PurchasePrice:     req.PurchasePrice,
		PurchaseQuantity:  req.PurchaseQuantity,
		PurchaseUnit:      strings.TrimSpace(req.PurchaseUnit),
		UsableYield:       yield,
		CostPerRecipeUnit: cost,
		PricePerUnit:      cost, // alias untuk backward-compat recipe_service
		WorkspaceID:       workspaceID,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
	}

	if err := s.ingredientRepo.Create(ing); err != nil {
		return nil, err
	}

	// Catat harga awal ke price history
	_ = s.ingredientRepo.CreatePriceHistory(&domain.PriceHistory{
		ID:               uuid.New().String(),
		IngredientID:     ing.ID,
		PricePerUnit:     cost,
		PurchasePrice:    ing.PurchasePrice,
		PurchaseQuantity: ing.PurchaseQuantity,
		PurchaseUnit:     ing.PurchaseUnit,
		UsableYield:      ing.UsableYield,
		RecordedAt:       time.Now(),
	})

	return ing, nil
}

func (s *IngredientService) ListIngredients(workspaceID string) ([]domain.Ingredient, error) {
	return s.ingredientRepo.List(workspaceID)
}

func (s *IngredientService) UpdateIngredient(id string, workspaceID string, req IngredientRequest) (*domain.Ingredient, error) {
	if err := validateIngredientRequest(req); err != nil {
		return nil, err
	}

	ing, err := s.ingredientRepo.GetByID(id, workspaceID)
	if err != nil {
		return nil, errors.New("bahan baku tidak ditemukan")
	}

	yield := req.UsableYield
	if yield <= 0 {
		yield = 100
	}
	newCost := calculateCostPerRecipeUnit(req.PurchasePrice, req.PurchaseQuantity, yield)

	// Catat ke price history hanya jika cost per resep berubah
	costChanged := newCost != ing.CostPerRecipeUnit

	ing.Name = strings.TrimSpace(req.Name)
	ing.Unit = strings.TrimSpace(req.Unit)
	ing.PurchasePrice = req.PurchasePrice
	ing.PurchaseQuantity = req.PurchaseQuantity
	ing.PurchaseUnit = strings.TrimSpace(req.PurchaseUnit)
	ing.UsableYield = yield
	ing.CostPerRecipeUnit = newCost
	ing.PricePerUnit = newCost // alias untuk backward-compat recipe_service
	if req.ReorderPoint != nil {
		ing.ReorderPoint = *req.ReorderPoint
	}
	ing.UpdatedAt = time.Now()

	if err := s.ingredientRepo.Update(ing); err != nil {
		return nil, err
	}

	if costChanged {
		_ = s.ingredientRepo.CreatePriceHistory(&domain.PriceHistory{
			ID:               uuid.New().String(),
			IngredientID:     ing.ID,
			PricePerUnit:     newCost,
			PurchasePrice:    ing.PurchasePrice,
			PurchaseQuantity: ing.PurchaseQuantity,
			PurchaseUnit:     ing.PurchaseUnit,
			UsableYield:      ing.UsableYield,
			RecordedAt:       time.Now(),
		})
	}

	return ing, nil
}

func (s *IngredientService) GetIngredientPriceHistory(id string, workspaceID string) ([]domain.PriceHistory, error) {
	_, err := s.ingredientRepo.GetByID(id, workspaceID)
	if err != nil {
		return nil, errors.New("bahan baku tidak ditemukan")
	}
	return s.ingredientRepo.GetPriceHistory(id)
}

func (s *IngredientService) AdjustStock(id string, workspaceID string, req AdjustStockRequest) (*domain.Ingredient, error) {
	if req.Quantity == 0 {
		return nil, errors.New("jumlah penyesuaian stok tidak boleh nol")
	}

	ing, err := s.ingredientRepo.GetByID(id, workspaceID)
	if err != nil {
		return nil, errors.New("bahan baku tidak ditemukan")
	}
	if ing.CurrentStock+req.Quantity < 0 {
		return nil, errors.New("stok tidak boleh menjadi negatif")
	}

	ing.CurrentStock += req.Quantity
	ing.UpdatedAt = time.Now()
	movementType := "IN"
	if req.Quantity < 0 {
		movementType = "ADJUSTMENT"
	}
	movement := &domain.StockMovement{
		ID:           uuid.New().String(),
		IngredientID: ing.ID,
		WorkspaceID:  workspaceID,
		Quantity:     req.Quantity,
		Type:         movementType,
		Note:         req.Note,
		CreatedAt:    time.Now(),
	}
	if err := s.ingredientRepo.AdjustStock(ing, movement); err != nil {
		return nil, err
	}
	return ing, nil
}

func (s *IngredientService) ListStockMovements(workspaceID string) ([]domain.StockMovement, error) {
	return s.ingredientRepo.GetStockMovements(workspaceID)
}

func (s *IngredientService) DeleteIngredient(id string, workspaceID string) error {
	used, err := s.ingredientRepo.IsUsed(id)
	if err != nil {
		return err
	}
	if used {
		return errors.New("bahan baku tidak bisa dihapus karena masih digunakan di satu atau lebih resep")
	}
	return s.ingredientRepo.Delete(id, workspaceID)
}
