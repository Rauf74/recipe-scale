package handler

import (
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"recipe-scale/backend/internal/middleware"
	"recipe-scale/backend/internal/repository"
	"recipe-scale/backend/internal/service"
)

func SetupRoutes(app *fiber.App, db *gorm.DB) {
	// 1. Initialize Repositories
	userRepo := repository.NewUserRepository(db)
	workspaceRepo := repository.NewWorkspaceRepository(db)
	ingredientRepo := repository.NewIngredientRepository(db)
	recipeRepo := repository.NewRecipeRepository(db)

	// 2. Initialize Services
	authService := service.NewAuthService(userRepo, workspaceRepo)
	ingredientService := service.NewIngredientService(ingredientRepo)
	recipeService := service.NewRecipeService(recipeRepo, ingredientRepo)

	// 3. Initialize Handlers
	authHandler := NewAuthHandler(authService)
	ingredientHandler := NewIngredientHandler(ingredientService)
	recipeHandler := NewRecipeHandler(recipeService)
	dashboardHandler := NewDashboardHandler(db, recipeService, ingredientService)

	// 4. Setup CORS / API Groups
	api := app.Group("/api")

	// 5. Auth Routes
	auth := api.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Post("/logout", authHandler.Logout)
	auth.Get("/me", middleware.RequireAuth, authHandler.Me)

	// 6. Ingredient Routes (Protected)
	ingredients := api.Group("/ingredients", middleware.RequireAuth)
	ingredients.Get("/", ingredientHandler.List)
	ingredients.Post("/", ingredientHandler.Create)
	ingredients.Put("/:id", ingredientHandler.Update)
	ingredients.Delete("/:id", ingredientHandler.Delete)
	ingredients.Get("/:id/history", ingredientHandler.GetPriceHistory)

	// 7. Recipe Routes (Protected)
	recipes := api.Group("/recipes", middleware.RequireAuth)
	recipes.Get("/", recipeHandler.List)
	recipes.Post("/", recipeHandler.Create)
	recipes.Get("/:id", recipeHandler.Get)
	recipes.Put("/:id", recipeHandler.Update)
	recipes.Delete("/:id", recipeHandler.Delete)
	recipes.Get("/:id/cost", recipeHandler.GetCost)

	// 8. Dashboard Routes (Protected)
	dashboard := api.Group("/dashboard", middleware.RequireAuth)
	dashboard.Get("/alerts", dashboardHandler.GetAlerts)
}
