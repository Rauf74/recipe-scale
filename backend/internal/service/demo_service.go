package service

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"recipe-scale/backend/internal/domain"
	"recipe-scale/backend/internal/jwtutil"
	"recipe-scale/backend/internal/repository"
)

type DemoService struct {
	db            *gorm.DB
	userRepo      *repository.UserRepository
	workspaceRepo *repository.WorkspaceRepository
}

func NewDemoService(db *gorm.DB, userRepo *repository.UserRepository, workspaceRepo *repository.WorkspaceRepository) *DemoService {
	return &DemoService{
		db:            db,
		userRepo:      userRepo,
		workspaceRepo: workspaceRepo,
	}
}

type DemoCredentials struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

type QuickDemoResponse struct {
	Token       string          `json:"token"`
	User        *domain.User    `json:"user"`
	Credentials DemoCredentials `json:"credentials"`
}

func (s *DemoService) GenerateQuickDemoUser() (*QuickDemoResponse, error) {
	// 1. Generate unique random suffix and credentials
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	randomSuffix := fmt.Sprintf("%04d", rng.Intn(10000))
	randomNum := fmt.Sprintf("%03d", rng.Intn(1000))

	rawPassword := fmt.Sprintf("demo%s", randomSuffix)
	email := fmt.Sprintf("owner_%s_%s@demo.recipescale.com", randomSuffix, randomNum)
	restoName := fmt.Sprintf("Dapur Resto Demo #%s", randomNum)
	userName := "Pemilik Resto (Demo)"

	// 2. Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(rawPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// 3. Create Workspace
	ws := &domain.Workspace{
		ID:                    uuid.New().String(),
		Name:                  restoName,
		DefaultTaxPercent:     10.0,
		DefaultServicePercent: 5.0,
		DefaultTargetFoodCost: 30.0,
		RoundPriceTo:          100,
		CreatedAt:             time.Now(),
	}
	if err := s.workspaceRepo.Create(ws); err != nil {
		return nil, fmt.Errorf("failed to create demo workspace: %w", err)
	}

	// 4. Create User
	user := &domain.User{
		ID:          uuid.New().String(),
		Name:        userName,
		Email:       email,
		Password:    string(hashedPassword),
		Role:        domain.RoleOwner,
		WorkspaceID: ws.ID,
		IsDemo:      true,
		CreatedAt:   time.Now(),
	}
	if err := s.userRepo.Create(user); err != nil {
		return nil, fmt.Errorf("failed to create demo user: %w", err)
	}

	// 5. Auto-seed realistic demo data into DB for this workspace
	if err := s.seedDemoWorkspaceData(ws.ID); err != nil {
		fmt.Printf("Warning: failed to seed demo workspace data: %v\n", err)
	}

	// 6. Generate JWT token
	jwtSecret, err := jwtutil.Secret()
	if err != nil {
		return nil, fmt.Errorf("jwt secret error: %w", err)
	}

	claims := JWTCustomClaims{
		UserID:      user.ID,
		Email:       user.Email,
		Role:        user.Role,
		WorkspaceID: user.WorkspaceID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * 7 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	tokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := tokenObj.SignedString([]byte(jwtSecret))
	if err != nil {
		return nil, fmt.Errorf("failed to sign token: %w", err)
	}

	return &QuickDemoResponse{
		Token: tokenString,
		User:  user,
		Credentials: DemoCredentials{
			Name:     restoName,
			Email:    email,
			Password: rawPassword,
			Role:     string(domain.RoleOwner),
		},
	}, nil
}

func calcUnitCost(price, qty, yield float64) float64 {
	if qty <= 0 || yield <= 0 {
		return 0
	}
	return (price / qty) / (yield / 100.0)
}

// seedDemoWorkspaceData populates realistic F&B ingredients, recipes, and stock movements for the demo workspace.
func (s *DemoService) seedDemoWorkspaceData(workspaceID string) error {
	now := time.Now()

	// Helper data
	ingData := []struct {
		Name         string
		Unit         string
		PurPrice     float64
		PurQty       float64
		PurUnit      string
		Yield        float64
		CurrentStock float64
		ReorderPoint float64
	}{
		{"Daging Sapi Paha", "kg", 130000, 1, "kg", 95, 15, 5},
		{"Daging Ayam Fillet", "kg", 55000, 1, "kg", 98, 25, 8},
		{"Bawang Merah", "g", 40000, 1000, "g", 90, 8000, 2000},
		{"Bawang Putih", "g", 36000, 1000, "g", 92, 9000, 2000},
		{"Cabai Merah Keriting", "g", 45000, 1000, "g", 95, 5000, 1500},
		{"Minyak Goreng Kelapa", "ml", 20000, 1000, "ml", 100, 12000, 3000},
		{"Beras Pulen Super", "g", 15000, 1000, "g", 100, 25000, 5000},
		{"Paperbox Takeaway Box", "pcs", 1500, 1, "pcs", 100, 200, 50},
	}

	createdIngs := make([]domain.Ingredient, len(ingData))

	for i, d := range ingData {
		unitCost := calcUnitCost(d.PurPrice, d.PurQty, d.Yield)
		ing := domain.Ingredient{
			ID:                uuid.New().String(),
			WorkspaceID:       workspaceID,
			Name:              d.Name,
			Unit:              d.Unit,
			PurchasePrice:     d.PurPrice,
			PurchaseQuantity:  d.PurQty,
			PurchaseUnit:      d.PurUnit,
			UsableYield:       d.Yield,
			CostPerRecipeUnit: unitCost,
			PricePerUnit:      unitCost,
			CurrentStock:      d.CurrentStock,
			ReorderPoint:      d.ReorderPoint,
			CreatedAt:         now,
			UpdatedAt:         now,
		}

		if err := s.db.Create(&ing).Error; err != nil {
			return err
		}
		createdIngs[i] = ing

		// Initial Stock Movement log
		sm := domain.StockMovement{
			ID:           uuid.New().String(),
			WorkspaceID:  workspaceID,
			IngredientID: ing.ID,
			Quantity:     d.CurrentStock,
			Type:         "IN",
			Note:         "Stok Awal Demo Dapur",
			CreatedAt:    now,
		}
		s.db.Create(&sm)
	}

	// Create 1 Base Recipe (Bumbu Merah Dapur)
	bumbuMerah := domain.Recipe{
		ID:             uuid.New().String(),
		WorkspaceID:    workspaceID,
		Name:           "Bumbu Merah Dapur (Batch 1 kg)",
		RecipeType:     "PREP",
		IsBaseRecipe:   true,
		YieldQuantity:  1,
		YieldUnit:      "kg",
		TargetFoodCost: 30,
		PackagingCost:  2000,
		OverheadCost:   3000,
		CreatedAt:      now,
		UpdatedAt:      now,
		Items: []domain.RecipeItem{
			{
				ID:           uuid.New().String(),
				IngredientID: &createdIngs[2].ID, // Bawang Merah
				Quantity:     400,
				Unit:         "g",
			},
			{
				ID:           uuid.New().String(),
				IngredientID: &createdIngs[3].ID, // Bawang Putih
				Quantity:     200,
				Unit:         "g",
			},
			{
				ID:           uuid.New().String(),
				IngredientID: &createdIngs[4].ID, // Cabai Merah
				Quantity:     400,
				Unit:         "g",
			},
		},
	}
	s.db.Create(&bumbuMerah)

	// Create 2 Menu Recipes
	menuRendang := domain.Recipe{
		ID:             uuid.New().String(),
		WorkspaceID:    workspaceID,
		Name:           "Rendang Sapi Porsi Resto",
		RecipeType:     "MENU",
		IsBaseRecipe:   false,
		YieldQuantity:  1,
		YieldUnit:      "porsi",
		SellingPrice:   55000,
		TargetFoodCost: 30,
		PackagingCost:  1500,
		OverheadCost:   2500,
		CreatedAt:      now,
		UpdatedAt:      now,
		Items: []domain.RecipeItem{
			{
				ID:           uuid.New().String(),
				IngredientID: &createdIngs[0].ID, // Daging Sapi Paha
				Quantity:     0.15,               // 150g
				Unit:         "kg",
			},
			{
				ID:          uuid.New().String(),
				SubRecipeID: &bumbuMerah.ID, // Bumbu Merah Dapur
				Quantity:    0.05,           // 50g
				Unit:        "kg",
			},
		},
	}
	s.db.Create(&menuRendang)

	menuNasiGoreng := domain.Recipe{
		ID:             uuid.New().String(),
		WorkspaceID:    workspaceID,
		Name:           "Nasi Goreng Spesial Ayam",
		RecipeType:     "MENU",
		IsBaseRecipe:   false,
		YieldQuantity:  1,
		YieldUnit:      "porsi",
		SellingPrice:   28000,
		TargetFoodCost: 28,
		PackagingCost:  1500,
		OverheadCost:   1500,
		CreatedAt:      now,
		UpdatedAt:      now,
		Items: []domain.RecipeItem{
			{
				ID:           uuid.New().String(),
				IngredientID: &createdIngs[6].ID, // Beras
				Quantity:     150,
				Unit:         "g",
			},
			{
				ID:           uuid.New().String(),
				IngredientID: &createdIngs[1].ID, // Ayam Fillet
				Quantity:     0.08,               // 80g
				Unit:         "kg",
			},
			{
				ID:          uuid.New().String(),
				SubRecipeID: &bumbuMerah.ID, // Bumbu Merah
				Quantity:    0.02,           // 20g
				Unit:        "kg",
			},
		},
	}
	s.db.Create(&menuNasiGoreng)

	return nil
}

// CleanupExpiredDemoData removes demo users & workspaces created more than 24 hours ago.
func CleanupExpiredDemoData(db *gorm.DB) error {
	cutoff := time.Now().Add(-24 * time.Hour)

	var demoUsers []domain.User
	if err := db.Where("is_demo = ? AND created_at < ?", true, cutoff).Find(&demoUsers).Error; err != nil {
		return err
	}

	for _, u := range demoUsers {
		db.Where("workspace_id = ?", u.WorkspaceID).Delete(&domain.StockMovement{})
		db.Where("workspace_id = ?", u.WorkspaceID).Delete(&domain.PriceHistory{})
		db.Where("workspace_id = ?", u.WorkspaceID).Delete(&domain.RecipeItem{})
		db.Where("workspace_id = ?", u.WorkspaceID).Delete(&domain.Recipe{})
		db.Where("workspace_id = ?", u.WorkspaceID).Delete(&domain.Ingredient{})
		db.Where("workspace_id = ?", u.WorkspaceID).Delete(&domain.CustomUnit{})
		db.Where("id = ?", u.WorkspaceID).Delete(&domain.Workspace{})
		db.Where("id = ?", u.ID).Delete(&domain.User{})
	}

	return nil
}
