package main

import (
	"fmt"
	"log"
	"math/rand"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"recipe-scale/backend/internal/domain"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from system env")
	}

	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		log.Fatal("DB_DSN environment variable is not set")
	}

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Error),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Seeder connected to MySQL. Clearing old tables...")
	
	// Delete in order to avoid foreign key constraint errors
	db.Exec("DELETE FROM production_batch_items")
	db.Exec("DELETE FROM production_batches")
	db.Exec("DELETE FROM recipe_items")
	db.Exec("DELETE FROM recipes")
	db.Exec("DELETE FROM price_histories")
	db.Exec("DELETE FROM stock_movements")
	db.Exec("DELETE FROM ingredients")

	// Get first workspace ID
	var ws domain.Workspace
	if err := db.First(&ws).Error; err != nil {
		log.Fatal("Please run the app first to initialize the default workspace")
	}
	wsID := ws.ID
	log.Printf("Using workspace: %s (%s)", ws.Name, wsID)

	// Create Ingredients
	log.Println("Creating realistic raw ingredients...")
	ingredientsList := []struct {
		Name         string
		Unit         string
		PurPrice     float64
		PurQty       float64
		PurUnit      string
		Yield        float64
		CurrentStock float64
		ReorderPoint float64
	}{
		// Daging & Seafood
		{"Daging Sapi Paha", "kg", 130000, 1, "kg", 95, 12, 5},
		{"Daging Sapi Tetelan", "kg", 95000, 1, "kg", 90, 8, 3},
		{"Daging Ayam Karkas", "kg", 38000, 1, "kg", 85, 25, 10},
		{"Daging Ayam Fillet (Dada)", "kg", 55000, 1, "kg", 98, 30, 8},
		{"Udang Windu Segar", "kg", 110000, 1, "kg", 75, 5, 2},
		{"Cumi-Cumi Ring", "kg", 85000, 1, "kg", 90, 7, 3},
		{"Bakso Sapi Halus", "pcs", 45000, 50, "butir", 100, 150, 50},
		{"Sosis Sapi Bratwurst", "pcs", 65000, 12, "pcs", 100, 48, 20},
		{"Kepiting Bakau", "kg", 160000, 1, "kg", 60, 4, 2},
		{"Tulang Sapi Sup", "kg", 48000, 1, "kg", 80, 15, 5},
		
		// Sayuran & Bumbu Basah
		{"Bawang Merah", "g", 40000, 1000, "g", 90, 8000, 3000},
		{"Bawang Putih", "g", 36000, 1000, "g", 92, 9000, 3000},
		{"Cabai Merah Keriting", "g", 45000, 1000, "g", 95, 6000, 2000},
		{"Cabai Rawit Merah", "g", 65000, 1000, "g", 96, 4000, 1500},
		{"Bawang Bombay", "g", 30000, 1000, "g", 88, 5000, 2000},
		{"Jahe Emprit", "g", 28000, 1000, "g", 85, 3000, 1000},
		{"Kunyit Basah", "g", 20000, 1000, "g", 80, 2000, 800},
		{"Lengkuas Muda", "g", 18000, 1000, "g", 82, 3000, 1000},
		{"Serai Segar", "g", 15000, 1000, "g", 60, 4000, 1000},
		{"Daun Jeruk Purut", "g", 25000, 500, "g", 100, 1000, 500},
		{"Daun Salam Kering", "g", 15000, 200, "g", 100, 600, 200},
		{"Daun Pandan Segar", "g", 10000, 200, "g", 100, 800, 200},
		{"Daun Bawang", "g", 18000, 1000, "g", 85, 4000, 1500},
		{"Daun Seledri", "g", 22000, 500, "g", 88, 2000, 800},
		{"Wortel Lokal", "g", 14000, 1000, "g", 85, 5000, 2000},
		{"Kentang Dieng", "g", 18000, 1000, "g", 88, 10000, 3000},
		{"Kol Kubis", "g", 10000, 1000, "g", 80, 7000, 2000},
		{"Tomat Merah Segar", "g", 16000, 1000, "g", 92, 8000, 2000},
		{"Timun Lalap", "g", 12000, 1000, "g", 90, 5000, 2000},
		{"Jeruk Nipis Peras", "g", 22000, 1000, "g", 45, 6000, 2000},
		{"Kangkung Cabut", "g", 8000, 500, "g", 75, 4000, 1500},
		{"Sawi Hijau", "g", 10000, 1000, "g", 80, 6000, 2000},
		{"Jamur Kancing", "g", 42000, 1000, "g", 95, 3000, 1000},
		{"Kemiri Bulat", "g", 50000, 1000, "g", 100, 4000, 1500},
		
		// Bahan Kering & Tepung
		{"Beras Premium Cianjur", "kg", 15000, 1, "kg", 100, 120, 40},
		{"Tepung Terigu Segitiga Biru", "g", 13000, 1000, "g", 100, 45000, 15000},
		{"Tepung Tapioka Rose Brand", "g", 14000, 1000, "g", 100, 20000, 5000},
		{"Tepung Beras", "g", 15000, 1000, "g", 100, 10000, 3000},
		{"Tepung Maizena", "g", 18000, 1000, "g", 100, 8000, 2000},
		{"Gula Pasir Putih", "g", 17500, 1000, "g", 100, 35000, 10000},
		{"Gula Aren Semut", "g", 32000, 1000, "g", 100, 15000, 5000},
		{"Garam Meja Beriodium", "g", 8000, 1000, "g", 100, 12000, 4000},
		{"Merica Bubuk Putih", "g", 120000, 1000, "g", 100, 3000, 1000},
		{"Ketumbar Bubuk", "g", 48000, 1000, "g", 100, 2000, 800},
		{"Kunyit Bubuk", "g", 50000, 1000, "g", 100, 2000, 800},
		{"Jinten Bubuk", "g", 90000, 1000, "g", 100, 1500, 500},
		{"Penyedap Rasa MSG Sasa", "g", 24000, 1000, "g", 100, 8000, 3000},
		{"Kaldu Ayam Bubuk Knorr", "g", 55000, 1000, "g", 100, 10000, 3000},
		{"Kaldu Sapi Bubuk Royco", "g", 42000, 1000, "g", 100, 8000, 3000},
		{"Asam Jawa Matang", "g", 25000, 1000, "g", 70, 3000, 1000},
		
		// Saus, Minyak, & Cairan
		{"Minyak Goreng Sawit Bimoli", "ml", 18000, 1000, "ml", 100, 80000, 30000},
		{"Minyak Wijen Lee Kum Kee", "ml", 45000, 750, "ml", 100, 4500, 1500},
		{"Kecap Manis Bango", "ml", 24000, 1000, "ml", 100, 25000, 10000},
		{"Kecap Asin ABC", "ml", 16000, 600, "ml", 100, 12000, 4000},
		{"Kecap Ikan Djoe Hoa", "ml", 28000, 600, "ml", 100, 6000, 2000},
		{"Saus Tiram Lee Kum Kee", "g", 36000, 510, "g", 100, 10200, 3000},
		{"Saus Tomat Indofood", "g", 15000, 1000, "g", 100, 15000, 5000},
		{"Saus Sambal Ekstra Pedas", "g", 17000, 1000, "g", 100, 20000, 5000},
		{"Santan Kelapa Cair Kara", "ml", 35000, 1000, "ml", 100, 24000, 8000},
		{"Air Mineral Dapur", "ml", 2000, 19000, "ml", 100, 190000, 50000},
		{"Susu UHT Full Cream Greenfields", "ml", 24000, 1000, "ml", 100, 36000, 12000},
		{"Susu Kental Manis Carnation", "g", 14500, 490, "g", 100, 9800, 3000},
		{"Susu Evaporasi F&N", "g", 17500, 380, "g", 100, 7600, 2000},
		{"Bubuk Kopi Arabika Gayo", "g", 240000, 1000, "g", 100, 8000, 3000},
		{"Teh Celup Hitam Sosro", "pcs", 8000, 25, "kantong", 100, 250, 1000},
		{"Bubuk Matcha Premium", "g", 350000, 1000, "g", 100, 2000, 800},
		{"Es Batu Kristal", "kg", 15000, 10, "kg", 100, 100, 30},
		
		// Kemasan & Penunjang
		{"Paper Box Food Grade", "pcs", 1200, 1, "pcs", 100, 1000, 300},
		{"Paper Cup 12oz", "pcs", 800, 1, "pcs", 100, 1500, 400},
		{"Tutup Paper Cup (Lid)", "pcs", 300, 1, "pcs", 100, 1500, 400},
		{"Sedotan Kertas Plastik", "pcs", 150, 1, "pcs", 100, 1500, 400},
		{"Kantong Plastik Singkong", "pcs", 400, 1, "pcs", 100, 1000, 300},
	}

	var savedIngredients []*domain.Ingredient
	for _, ing := range ingredientsList {
		// Calculate CostPerRecipeUnit = (PurchasePrice / PurchaseQuantity) / (UsableYield / 100)
		costPerUnit := (ing.PurPrice / ing.PurQty) / (ing.Yield / 100.0)
		
		newIng := &domain.Ingredient{
			ID:                uuid.New().String(),
			Name:              ing.Name,
			WorkspaceID:       wsID,
			Unit:              ing.Unit,
			PurchasePrice:     ing.PurPrice,
			PurchaseQuantity:  ing.PurQty,
			PurchaseUnit:      ing.PurUnit,
			UsableYield:       ing.Yield,
			CostPerRecipeUnit: costPerUnit,
			PricePerUnit:      costPerUnit,
			CurrentStock:      ing.CurrentStock,
			ReorderPoint:      ing.ReorderPoint,
			CreatedAt:         time.Now().Add(-240 * time.Hour),
			UpdatedAt:         time.Now(),
		}
		if err := db.Create(newIng).Error; err != nil {
			log.Fatalf("Failed to create ingredient %s: %v", ing.Name, err)
		}
		savedIngredients = append(savedIngredients, newIng)
		
		// Insert price history entry
		ph := &domain.PriceHistory{
			ID:               uuid.New().String(),
			IngredientID:     newIng.ID,
			PricePerUnit:     costPerUnit,
			PurchasePrice:    ing.PurPrice,
			PurchaseQuantity: ing.PurQty,
			PurchaseUnit:     ing.PurUnit,
			UsableYield:      ing.Yield,
			RecordedAt:       time.Now().Add(-240 * time.Hour),
		}
		db.Create(ph)

		// Insert initial stock movement
		sm := &domain.StockMovement{
			ID:           uuid.New().String(),
			IngredientID: newIng.ID,
			WorkspaceID:  wsID,
			Quantity:     ing.CurrentStock,
			Type:         "ADJUSTMENT",
			Note:         "Stok Awal Saldo Seeder",
			CreatedAt:    time.Now().Add(-240 * time.Hour),
		}
		db.Create(sm)
	}
	log.Printf("Successfully created %d ingredients", len(savedIngredients))

	// Find ingredients by name helper
	findIng := func(name string) *domain.Ingredient {
		for _, ing := range savedIngredients {
			if ing.Name == name {
				return ing
			}
		}
		// Fallback to random if not found
		return savedIngredients[rand.Intn(len(savedIngredients))]
	}

	// Create 100 Base Recipes (PREP / Bumbu Dasar / Sub-recipes)
	log.Println("Generating 100 base recipes (Bumbu Dasar)...")
	var savedBaseRecipes []*domain.Recipe
	
	// Predefined core base recipes
	predefinedBumbuList := []struct {
		Name string
		Unit string
		Qty  float64
		Items []struct {
			IngName string
			Qty     float64
		}
	}{
		{
			"Bumbu Dasar Merah", "g", 1000, []struct {
				IngName string
				Qty     float64
			}{
				{"Bawang Merah", 400},
				{"Bawang Putih", 150},
				{"Cabai Merah Keriting", 400},
				{"Minyak Goreng Sawit Bimoli", 100},
				{"Garam Meja Beriodium", 20},
			},
		},
		{
			"Bumbu Dasar Putih", "g", 1000, []struct {
				IngName string
				Qty     float64
			}{
				{"Bawang Merah", 500},
				{"Bawang Putih", 250},
				{"Kemiri Bulat", 150},
				{"Minyak Goreng Sawit Bimoli", 100},
				{"Garam Meja Beriodium", 20},
			},
		},
		{
			"Bumbu Dasar Kuning", "g", 1000, []struct {
				IngName string
				Qty     float64
			}{
				{"Bawang Merah", 400},
				{"Bawang Putih", 200},
				{"Kunyit Basah", 150},
				{"Kemiri Bulat", 100},
				{"Lengkuas Muda", 50},
				{"Jahe Emprit", 50},
				{"Minyak Goreng Sawit Bimoli", 100},
			},
		},
		{
			"Sambal Terasi Matang", "g", 1000, []struct {
				IngName string
				Qty     float64
			}{
				{"Cabai Rawit Merah", 500},
				{"Cabai Merah Keriting", 200},
				{"Bawang Merah", 150},
				{"Tomat Merah Segar", 150},
				{"Gula Aren Semut", 40},
				{"Garam Meja Beriodium", 20},
				{"Minyak Goreng Sawit Bimoli", 80},
			},
		},
		{
			"Sambal Ijo Padang", "g", 1000, []struct {
				IngName string
				Qty     float64
			}{
				{"Cabai Merah Keriting", 600},
				{"Bawang Merah", 200},
				{"Tomat Merah Segar", 150},
				{"Minyak Goreng Sawit Bimoli", 100},
				{"Garam Meja Beriodium", 20},
			},
		},
		{
			"Minyak Bawang Gurih", "ml", 1000, []struct {
				IngName string
				Qty     float64
			}{
				{"Bawang Putih", 300},
				{"Minyak Goreng Sawit Bimoli", 900},
			},
		},
		{
			"Sirup Gula Aren", "ml", 1000, []struct {
				IngName string
				Qty     float64
			}{
				{"Gula Aren Semut", 600},
				{"Air Mineral Dapur", 500},
				{"Daun Pandan Segar", 10},
			},
		},
		{
			"Kaldu Ayam Pekat", "ml", 5000, []struct {
				IngName string
				Qty     float64
			}{
				{"Daging Ayam Fillet (Dada)", 0.6}, // 0.6 kg (600g)
				{"Tulang Sapi Sup", 0.4}, // 0.4 kg (400g)
				{"Air Mineral Dapur", 4500},
				{"Bawang Putih", 50},
				{"Garam Meja Beriodium", 30},
			},
		},
		{
			"Adonan Tepung Crispy", "g", 1000, []struct {
				IngName string
				Qty     float64
			}{
				{"Tepung Terigu Segitiga Biru", 800},
				{"Tepung Tapioka Rose Brand", 150},
				{"Merica Bubuk Putih", 10},
				{"Garam Meja Beriodium", 20},
				{"Penyedap Rasa MSG Sasa", 10},
			},
		},
		{
			"Bumbu Rendang Racik", "g", 1000, []struct {
				IngName string
				Qty     float64
			}{
				{"Bawang Merah", 300},
				{"Bawang Putih", 100},
				{"Cabai Merah Keriting", 300},
				{"Ketumbar Bubuk", 20},
				{"Jinten Bubuk", 10},
				{"Santan Kelapa Cair Kara", 300},
			},
		},
	}

	// Create predefined ones first
	for _, pb := range predefinedBumbuList {
		recipe := &domain.Recipe{
			ID:             uuid.New().String(),
			Name:           pb.Name,
			YieldQuantity:  pb.Qty,
			YieldUnit:      pb.Unit,
			RecipeType:     "PREP",
			IsBaseRecipe:   true,
			TargetFoodCost: 30.00,
			WorkspaceID:    wsID,
			CreatedAt:      time.Now().Add(-120 * time.Hour),
			UpdatedAt:      time.Now(),
		}
		
		var items []domain.RecipeItem
		for _, item := range pb.Items {
			ing := findIng(item.IngName)
			ingIDCopy := ing.ID
			items = append(items, domain.RecipeItem{
				ID:           uuid.New().String(),
				RecipeID:     recipe.ID,
				IngredientID: &ingIDCopy,
				Quantity:     item.Qty,
				Unit:         ing.Unit,
			})
		}
		recipe.Items = items
		if err := db.Create(recipe).Error; err != nil {
			log.Fatalf("Failed to create base recipe %s: %v", pb.Name, err)
		}
		savedBaseRecipes = append(savedBaseRecipes, recipe)
	}

	// Programmatically generate remaining base recipes up to 100
	aromas := []string{"Pedas", "Manis", "Gurih", "Aromatik", "Wangi", "Asam", "Sedap", "Spesial", "Mantap", "Khas Koki"}
	categories := []string{"Saus", "Bumbu", "Karamel", "Pasta", "Minyak", "Kaldu", "Sambal", "Sirup", "Tepung", "Marinade"}
	names := []string{"Bebek", "Daging", "Ikan", "Sayur", "Ayam", "Seafood", "Kopi", "Teh", "Sop", "Soto"}

	rSource := rand.New(rand.NewSource(99))
	for i := len(savedBaseRecipes) + 1; i <= 100; i++ {
		ar := aromas[rSource.Intn(len(aromas))]
		cat := categories[rSource.Intn(len(categories))]
		nm := names[rSource.Intn(len(names))]
		
		baseName := fmt.Sprintf("%s %s %s %d", cat, nm, ar, i)
		yieldUnit := "g"
		if cat == "Saus" || cat == "Minyak" || cat == "Kaldu" || cat == "Sirup" {
			yieldUnit = "ml"
		}
		
		recipe := &domain.Recipe{
			ID:             uuid.New().String(),
			Name:           baseName,
			YieldQuantity:  1000,
			YieldUnit:      yieldUnit,
			RecipeType:     "PREP",
			IsBaseRecipe:   true,
			TargetFoodCost: 30.00,
			WorkspaceID:    wsID,
			CreatedAt:      time.Now().Add(-100 * time.Hour),
			UpdatedAt:      time.Now(),
		}

		// Pick 3 random raw ingredients with realistic units matching quantity limits!
		var items []domain.RecipeItem
		for k := 0; k < 3; k++ {
			ing := savedIngredients[rSource.Intn(len(savedIngredients))]
			ingIDCopy := ing.ID
			
			var qty float64
			unitL := strings.ToLower(ing.Unit)
			if unitL == "kg" || unitL == "l" || unitL == "l" {
				qty = 0.01 + rSource.Float64()*0.10 // 10g to 110g/ml
			} else if unitL == "g" || unitL == "ml" {
				qty = 10.0 + rSource.Float64()*100.0 // 10g to 110g/ml
			} else {
				qty = 1.0 + float64(rSource.Intn(2)) // 1 to 2 pcs
			}
			qty = float64(int(qty*1000)) / 1000.0

			items = append(items, domain.RecipeItem{
				ID:           uuid.New().String(),
				RecipeID:     recipe.ID,
				IngredientID: &ingIDCopy,
				Quantity:     qty,
				Unit:         ing.Unit,
			})
		}
		recipe.Items = items
		if err := db.Create(recipe).Error; err != nil {
			log.Fatalf("Failed to create generated base recipe %s: %v", baseName, err)
		}
		savedBaseRecipes = append(savedBaseRecipes, recipe)
	}
	log.Printf("Successfully created %d Base Recipes (Bumbu Dasar/Sub-resep)", len(savedBaseRecipes))

	// Create 100 Menu Recipes (MENU)
	log.Println("Generating 100 menu recipes...")
	var savedMenuRecipes []*domain.Recipe

	predefinedMenuList := []struct {
		Name        string
		Price       float64
		Packaging   float64
		Overhead    float64
		TargetFC    float64
		RawItems    []struct {
			Name string
			Qty  float64
		}
		BaseRecipes []struct {
			Index int // index in savedBaseRecipes
			Qty   float64
		}
	}{
		{
			"Nasi Goreng Spesial Minang", 22000, 1200, 1500, 30.0,
			[]struct {
				Name string
				Qty  float64
			}{
				{"Beras Premium Cianjur", 0.15}, // 0.15 kg
				{"Daging Ayam Fillet (Dada)", 0.05}, // 0.05 kg
				{"Bakso Sapi Halus", 2},
				{"Minyak Goreng Sawit Bimoli", 20},
				{"Kecap Manis Bango", 15},
			},
			[]struct {
				Index int
				Qty   float64
			}{
				{0, 25}, // Bumbu Dasar Merah
				{5, 10}, // Minyak Bawang Gurih
			},
		},
		{
			"Nasi Rendang Sapi RM Minang", 38000, 1600, 2000, 32.0,
			[]struct {
				Name string
				Qty  float64
			}{
				{"Beras Premium Cianjur", 0.15},
				{"Daging Sapi Paha", 0.1},
				{"Garam Meja Beriodium", 5},
			},
			[]struct {
				Index int
				Qty   float64
			}{
				{9, 40}, // Bumbu Rendang Racik
				{3, 15}, // Sambal Terasi Matang
			},
		},
		{
			"Ayam Goreng Lengkuas Gurih", 25000, 1200, 1500, 28.0,
			[]struct {
				Name string
				Qty  float64
			}{
				{"Daging Ayam Karkas", 0.25},
				{"Lengkuas Muda", 30},
				{"Minyak Goreng Sawit Bimoli", 50},
			},
			[]struct {
				Index int
				Qty   float64
			}{
				{2, 30}, // Bumbu Dasar Kuning
			},
		},
		{
			"Es Kopi Susu Aren Klasik", 18000, 1250, 1000, 25.0,
			[]struct {
				Name string
				Qty  float64
			}{
				{"Bubuk Kopi Arabika Gayo", 15},
				{"Susu UHT Full Cream Greenfields", 120},
				{"Es Batu Kristal", 0.15},
			},
			[]struct {
				Index int
				Qty   float64
			}{
				{6, 25}, // Sirup Gula Aren
			},
		},
		{
			"Soto Ayam Lamongan", 24000, 1200, 1500, 30.0,
			[]struct {
				Name string
				Qty  float64
			}{
				{"Daging Ayam Fillet (Dada)", 0.08},
				{"Wortel Lokal", 20},
				{"Daun Bawang", 15},
				{"Kol Kubis", 25},
			},
			[]struct {
				Index int
				Qty   float64
			}{
				{2, 35}, // Bumbu Dasar Kuning
				{7, 250}, // Kaldu Ayam Pekat (250 ml of a 5000ml batch)
			},
		},
		{
			"Sate Ayam Madura (10 Tusuk)", 28000, 1600, 1500, 30.0,
			[]struct {
				Name string
				Qty  float64
			}{
				{"Daging Ayam Fillet (Dada)", 0.18},
				{"Minyak Goreng Sawit Bimoli", 20},
				{"Kecap Manis Bango", 15},
			},
			[]struct {
				Index int
				Qty   float64
			}{
				{1, 20}, // Bumbu Dasar Putih
				{3, 10}, // Sambal Terasi Matang
			},
		},
	}

	// Create predefined menu items
	for _, pm := range predefinedMenuList {
		recipe := &domain.Recipe{
			ID:             uuid.New().String(),
			Name:           pm.Name,
			YieldQuantity:  1,
			YieldUnit:      "portions",
			RecipeType:     "MENU",
			IsBaseRecipe:   false,
			SellingPrice:   pm.Price,
			TargetFoodCost: pm.TargetFC,
			PackagingCost:  pm.Packaging,
			OverheadCost:   pm.Overhead,
			WorkspaceID:    wsID,
			CreatedAt:      time.Now().Add(-60 * time.Hour),
			UpdatedAt:      time.Now(),
		}

		var items []domain.RecipeItem
		for _, rawItem := range pm.RawItems {
			ing := findIng(rawItem.Name)
			ingIDCopy := ing.ID
			items = append(items, domain.RecipeItem{
				ID:           uuid.New().String(),
				RecipeID:     recipe.ID,
				IngredientID: &ingIDCopy,
				Quantity:     rawItem.Qty,
				Unit:         ing.Unit,
			})
		}
		for _, baseItem := range pm.BaseRecipes {
			baseRecipe := savedBaseRecipes[baseItem.Index]
			baseRecipeIDCopy := baseRecipe.ID
			items = append(items, domain.RecipeItem{
				ID:          uuid.New().String(),
				RecipeID:    recipe.ID,
				SubRecipeID: &baseRecipeIDCopy,
				Quantity:    baseItem.Qty,
				Unit:        baseRecipe.YieldUnit,
			})
		}
		recipe.Items = items
		if err := db.Create(recipe).Error; err != nil {
			log.Fatalf("Failed to create menu recipe %s: %v", pm.Name, err)
		}
		savedMenuRecipes = append(savedMenuRecipes, recipe)
	}

	// Programmatically generate remaining menus up to 100
	types := []string{"Nasi", "Mie", "Ayam", "Gurame", "Cumi", "Sate", "Soto", "Es", "Kopi", "Teh", "Tumis", "Bakso"}
	styles := []string{"Goreng", "Bakar", "Rebus", "Penyet", "Rica-rica", "Saus Padang", "Asam Manis", "Mentega", "Kuah", "Es Leci"}
	toppings := []string{"Spesial Outlet", "Premium RM Minang", "Ala Chef", "Pedas Setan", "Bumbu Rempah", "Gula Aren", "Susu Evaporasi", "Sambal Ijo", "Komplit", "Keju Mozzarella"}

	rSourceMenu := rand.New(rand.NewSource(1001))
	for i := len(savedMenuRecipes) + 1; i <= 100; i++ {
		tp := types[rSourceMenu.Intn(len(types))]
		sty := styles[rSourceMenu.Intn(len(styles))]
		top := toppings[rSourceMenu.Intn(len(toppings))]
		
		menuName := fmt.Sprintf("%s %s %s %d", tp, sty, top, i)
		price := float64(20000 + rSourceMenu.Intn(16)*5000) // Rp 20.000 to Rp 95.000
		packaging := float64(500 + rSourceMenu.Intn(6)*500)
		overhead := float64(1000 + rSourceMenu.Intn(7)*500)
		targetFC := float64(25 + rSourceMenu.Intn(11)) // 25% to 35%

		recipe := &domain.Recipe{
			ID:             uuid.New().String(),
			Name:           menuName,
			YieldQuantity:  1,
			YieldUnit:      "portions",
			RecipeType:     "MENU",
			IsBaseRecipe:   false,
			SellingPrice:   price,
			TargetFoodCost: targetFC,
			PackagingCost:  packaging,
			OverheadCost:   overhead,
			WorkspaceID:    wsID,
			CreatedAt:      time.Now().Add(-50 * time.Hour),
			UpdatedAt:      time.Now(),
		}

		var items []domain.RecipeItem
		
		// Pick 1-2 random base recipes
		numBumbu := 1 + rSourceMenu.Intn(2)
		for k := 0; k < numBumbu; k++ {
			baseRecipe := savedBaseRecipes[rSourceMenu.Intn(len(savedBaseRecipes))]
			baseRecipeIDCopy := baseRecipe.ID
			
			// Base recipe yields 1000 g or 1000 ml. Menu needs a small fraction like 10g to 45g
			qty := 10.0 + rSourceMenu.Float64()*35.0 // 10 to 45 g/ml
			qty = float64(int(qty))

			items = append(items, domain.RecipeItem{
				ID:          uuid.New().String(),
				RecipeID:    recipe.ID,
				SubRecipeID: &baseRecipeIDCopy,
				Quantity:    qty,
				Unit:        baseRecipe.YieldUnit,
			})
		}

		// Pick 2 random raw ingredients
		for k := 0; k < 2; k++ {
			ing := savedIngredients[rSourceMenu.Intn(len(savedIngredients))]
			ingIDCopy := ing.ID
			
			var qty float64
			unitL := strings.ToLower(ing.Unit)
			if unitL == "kg" || unitL == "l" || unitL == "l" {
				qty = 0.01 + rSourceMenu.Float64()*0.10 // 10g to 110g
			} else if unitL == "g" || unitL == "ml" {
				qty = 5.0 + rSourceMenu.Float64()*45.0 // 5g to 50g
			} else {
				qty = 1.0 + float64(rSourceMenu.Intn(2)) // 1 to 2 pcs
			}
			qty = float64(int(qty*1000)) / 1000.0

			items = append(items, domain.RecipeItem{
				ID:           uuid.New().String(),
				RecipeID:     recipe.ID,
				IngredientID: &ingIDCopy,
				Quantity:     qty,
				Unit:         ing.Unit,
			})
		}

		recipe.Items = items
		if err := db.Create(recipe).Error; err != nil {
			log.Fatalf("Failed to create generated menu recipe %s: %v", menuName, err)
		}
		savedMenuRecipes = append(savedMenuRecipes, recipe)
	}
	log.Printf("Successfully created %d Menu Recipes (MENU)", len(savedMenuRecipes))

	// Generate Production Batches
	log.Println("Generating production batches logs...")
	batchNotes := []string{
		"Stok pagi pembukaan outlet",
		"Persiapan katering makan siang PT Nusa",
		"Ekstra es untuk event cuaca panas",
		"Produksi cadangan akhir pekan",
		"Batch sore pengisian stok menipis",
	}

	for i := 1; i <= 8; i++ {
		menuRecipe := savedMenuRecipes[rand.Intn(len(savedMenuRecipes))]
		status := "COMPLETED"
		if i > 5 {
			status = "PLANNED"
		}
		
		qty := float64(10 + rand.Intn(4)*10) // 10, 20, 30, 40 portions
		note := batchNotes[rand.Intn(len(batchNotes))]
		
		// Calculate batch items snapshot and estimated cost
		var totalCost float64
		var batchItems []domain.ProductionBatchItem
		batchID := uuid.New().String()

		for _, item := range menuRecipe.Items {
			// Resolve name and price
			var itemName string
			var unitCost float64
			var unit string

			if item.IngredientID != nil {
				var ing domain.Ingredient
				db.First(&ing, "id = ?", *item.IngredientID)
				itemName = ing.Name
				unitCost = ing.CostPerRecipeUnit
				unit = ing.Unit
			} else if item.SubRecipeID != nil {
				var sub domain.Recipe
				db.First(&sub, "id = ?", *item.SubRecipeID)
				itemName = sub.Name
				unit = sub.YieldUnit
				// Calculate yield cost for sub-recipe (simplified sum of its item costs)
				var subItems []domain.RecipeItem
				db.Find(&subItems, "recipe_id = ?", sub.ID)
				var subTotal float64
				for _, sItem := range subItems {
					if sItem.IngredientID != nil {
						var ing domain.Ingredient
						db.First(&ing, "id = ?", *sItem.IngredientID)
						subTotal += sItem.Quantity * ing.CostPerRecipeUnit
					}
				}
				unitCost = subTotal / sub.YieldQuantity
			}

			itemQty := item.Quantity * qty
			itemCost := itemQty * unitCost
			totalCost += itemCost

			batchItems = append(batchItems, domain.ProductionBatchItem{
				ID:             uuid.New().String(),
				BatchID:        batchID,
				IngredientID:   uuid.New().String(), // simple placeholder ID for log item
				IngredientName: itemName,
				Quantity:       itemQty,
				Unit:           unit,
				EstimatedCost:  itemCost,
			})
		}

		batch := &domain.ProductionBatch{
			ID:            batchID,
			WorkspaceID:   wsID,
			RecipeID:      menuRecipe.ID,
			TargetYield:   qty,
			YieldUnit:     menuRecipe.YieldUnit,
			Status:        status,
			Notes:         note,
			EstimatedCost: totalCost + menuRecipe.PackagingCost*qty + menuRecipe.OverheadCost*qty,
			Items:         batchItems,
			CreatedAt:     time.Now().Add(time.Duration(-rand.Intn(72)) * time.Hour),
		}

		if status == "COMPLETED" {
			completedTime := batch.CreatedAt.Add(2 * time.Hour)
			batch.CompletedAt = &completedTime
		}

		if err := db.Create(batch).Error; err != nil {
			log.Fatalf("Failed to create production batch %d: %v", i, err)
		}
	}
	
	log.Println("Seeding complete! Database is now fully populated with 100 ingredients, 100 base recipes, 100 menu items, and realistic production logs.")
}
