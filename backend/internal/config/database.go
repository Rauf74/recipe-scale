package config

import (
	"log"
	"os"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"recipe-scale/backend/internal/domain"
)

var DB *gorm.DB

func InitDB() *gorm.DB {
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		log.Fatal("DB_DSN environment variable is not set")
	}

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn), // Log slow queries + errors; tidak log setiap query
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Database connection established. Running migrations...")

	// Run Auto-Migrations
	err = DB.AutoMigrate(
		&domain.Workspace{},
		&domain.User{},
		&domain.Ingredient{},
		&domain.Recipe{},
		&domain.RecipeItem{},
		&domain.PriceHistory{},
		&domain.StockMovement{},
		&domain.ProductionBatch{},
		&domain.ProductionBatchItem{},
		&domain.CustomUnit{},
	)
	if err != nil {
		log.Fatalf("Failed to run database migrations: %v", err)
	}

	log.Println("Database migrations completed successfully!")
	return DB
}
