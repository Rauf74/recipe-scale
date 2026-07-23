package handler

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"gorm.io/gorm"

	"recipe-scale/backend/internal/middleware"
	"recipe-scale/backend/internal/repository"
	"recipe-scale/backend/internal/service"
)

func SetupRoutes(app *fiber.App, db *gorm.DB) {
	// Initialize Middleware DB dependency
	middleware.Init(db)

	// 1. Initialize Repositories
	userRepo := repository.NewUserRepository(db)
	workspaceRepo := repository.NewWorkspaceRepository(db)
	ingredientRepo := repository.NewIngredientRepository(db)
	recipeRepo := repository.NewRecipeRepository(db)
	customUnitRepo := repository.NewCustomUnitRepository(db)

	// 2. Initialize Services
	authService := service.NewAuthService(userRepo, workspaceRepo)
	demoService := service.NewDemoService(db, userRepo, workspaceRepo)
	ingredientService := service.NewIngredientService(ingredientRepo)
	recipeService := service.NewRecipeService(recipeRepo, ingredientRepo)
	productionRepo := repository.NewProductionRepository(db)
	productionService := service.NewProductionService(productionRepo, recipeRepo, recipeService)
	workspaceService := service.NewWorkspaceService(workspaceRepo)
	customUnitService := service.NewCustomUnitService(customUnitRepo)

	// 3. Initialize Services (cont.)
	dashboardService := service.NewDashboardService(db, recipeService, ingredientService)

	// 4. Initialize Handlers
	authHandler := NewAuthHandler(authService)
	demoHandler := NewDemoHandler(demoService)
	ingredientHandler := NewIngredientHandler(ingredientService)
	recipeHandler := NewRecipeHandler(recipeService)
	productionHandler := NewProductionHandler(productionService)
	dashboardHandler := NewDashboardHandler(dashboardService)
	analyticsHandler := NewAnalyticsHandler(recipeService)
	workspaceHandler := NewWorkspaceHandler(workspaceService)
	customUnitHandler := NewCustomUnitHandler(customUnitService)

	// Start Background Demo Cleanup Worker (every 6 hours)
	go func() {
		ticker := time.NewTicker(6 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			_ = service.CleanupExpiredDemoData(db)
		}
	}()

	// 4. Setup CORS / API Groups
	api := app.Group("/api")

	// 5. Auth Routes (terpisah dengan dedicated rate limiters untuk proteksi brute-force & spam)
	auth := api.Group("/auth")

	// Rate limiter khusus untuk login & register (mencegah brute-force password)
	loginRegisterLimiter := limiter.New(limiter.Config{
		Max:        10,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "Terlalu banyak percobaan masuk/daftar, silakan tunggu 1 menit lagi.",
			})
		},
	})

	// Rate limiter ketat khusus untuk quick-demo (mencegah bot menspam pembuatan workspace DB)
	quickDemoLimiter := limiter.New(limiter.Config{
		Max:        3,
		Expiration: 15 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "Batas pembuatan dapur demo tercapai (maksimal 3 kali per 15 menit). Silakan tunggu beberapa saat.",
			})
		},
	})

	auth.Post("/register", loginRegisterLimiter, authHandler.Register)
	auth.Post("/login", loginRegisterLimiter, authHandler.Login)
	auth.Post("/quick-demo", quickDemoLimiter, demoHandler.QuickDemo)
	auth.Post("/logout", authHandler.Logout)
	auth.Get("/me", middleware.RequireAuth, authHandler.Me)

	// 6. Ingredient Routes (Protected)
	ingredients := api.Group("/ingredients", middleware.RequireAuth)
	ingredients.Get("/", ingredientHandler.List)
	ingredients.Post("/", ingredientHandler.Create)
	// PENTING: route statis (/stock-movements) harus didaftarkan SEBELUM route dengan
	// parameter (/:id) agar Fiber tidak menangkap "stock-movements" sebagai nilai :id.
	ingredients.Get("/stock-movements", ingredientHandler.ListStockMovements)
	ingredients.Put("/:id", ingredientHandler.Update)
	ingredients.Delete("/:id", ingredientHandler.Delete)
	ingredients.Get("/:id/history", ingredientHandler.GetPriceHistory)
	ingredients.Post("/:id/stock-adjustments", ingredientHandler.AdjustStock)

	// 7. Recipe Routes (Protected)
	recipes := api.Group("/recipes", middleware.RequireAuth)
	recipes.Get("/", recipeHandler.List)
	recipes.Post("/", recipeHandler.Create)
	recipes.Get("/:id", recipeHandler.Get)
	recipes.Put("/:id", recipeHandler.Update)
	recipes.Delete("/:id", recipeHandler.Delete)
	recipes.Get("/:id/cost", recipeHandler.GetCost)

	// 8. Production routes (Protected)
	production := api.Group("/production", middleware.RequireAuth)
	production.Get("/batches", productionHandler.List)
	production.Post("/batches", productionHandler.Create)
	production.Post("/batches/:id/complete", productionHandler.Complete)

	// 9. Dashboard Routes (Protected)
	dashboard := api.Group("/dashboard", middleware.RequireAuth)
	dashboard.Get("/alerts", dashboardHandler.GetAlerts)

	analytics := api.Group("/analytics", middleware.RequireAuth)
	analytics.Get("/menu-performance", analyticsHandler.MenuPerformance)

	// 10. Workspace Routes (Protected)
	workspaces := api.Group("/workspace", middleware.RequireAuth)
	workspaces.Get("/", workspaceHandler.Get)
	workspaces.Put("/", workspaceHandler.Update)

	// 11. Custom Unit Routes (Protected)
	customUnits := api.Group("/custom-units", middleware.RequireAuth)
	customUnits.Get("/", customUnitHandler.List)
	customUnits.Post("/", customUnitHandler.Create)
	customUnits.Delete("/:id", customUnitHandler.Delete)
}
