package config

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/url"
	"os"
	"strings"

	mysqldriver "github.com/go-sql-driver/mysql"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"recipe-scale/backend/internal/domain"
)

// normalizeDSN mengubah connection string Aiven (mysql://user:pass@host:port/db?ssl-mode=REQUIRED)
// menjadi format GORM (user:pass@tcp(host:port)/db?tls=aiven&parseTime=true&loc=Local).
// Kalau sudah format GORM, dikembalikan apa adanya.
func normalizeDSN(raw string) string {
	if !strings.HasPrefix(raw, "mysql://") && !strings.HasPrefix(raw, "mysqlx://") {
		return raw
	}

	u, err := url.Parse(raw)
	if err != nil {
		return raw
	}

	user := ""
	pass := ""
	if u.User != nil {
		user = u.User.Username()
		pass, _ = u.User.Password()
	}

	host := u.Hostname()
	port := u.Port()
	dbname := strings.TrimPrefix(u.Path, "/")

	q := u.Query()
	// Aiven pakai ssl-mode=REQUIRED, Go butuh tls=aiven
	if q.Get("ssl-mode") != "" {
		q.Del("ssl-mode")
		q.Set("tls", "aiven")
	}
	if q.Get("tls") == "" {
		q.Set("tls", "aiven")
	}
	if q.Get("parseTime") == "" {
		q.Set("parseTime", "true")
	}
	if q.Get("loc") == "" {
		q.Set("loc", "Local")
	}

	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?%s", user, pass, host, port, dbname, q.Encode())
}

func InitDB() *gorm.DB {
	rawDSN := os.Getenv("DB_DSN")
	if rawDSN == "" {
		log.Fatal("DB_DSN environment variable is not set")
	}

	dsn := normalizeDSN(rawDSN)

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

	// AutoMigrate hanya jalan di development. Di production (Vercel/Render dengan APP_ENV=production)
	// migrasi lambat dan bisa bikin server timeout. Jalankan migrate manual atau gunakan migration tool.
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
