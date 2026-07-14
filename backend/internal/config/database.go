package config

import (
	"crypto/tls"
	"log"
	"os"

	mysqldriver "github.com/go-sql-driver/mysql"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"recipe-scale/backend/internal/domain"
)

func InitDB() *gorm.DB {
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		log.Fatal("DB_DSN environment variable is not set")
	}

	// Daftarkan TLS config "aiven" — Aiven pakai self-signed cert, jadi skip verify.
	// Pendekatan sama kayak task-management yang pake rejectUnauthorized: false di Prisma adapter.
	mysqldriver.RegisterTLSConfig("aiven", &tls.Config{
		InsecureSkipVerify: true,
	})

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// AutoMigrate hanya jalan di development. Di production (Vercel) migrasi lambat
	// dan bikin server timeout 30 detik. Jalankan migrate manual atau gunakan migration tool.
	if os.Getenv("APP_ENV") != "production" {
		log.Println("Database connection established. Running migrations...")

		err = db.AutoMigrate(
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
	} else {
		log.Println("Database connection established. Skipping migrations (production mode).")
	}
	return db
}
