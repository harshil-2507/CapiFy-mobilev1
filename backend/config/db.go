package config

import (
	"finance-app-backend/models"
	"finance-app-backend/utils"
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func ConnectDatabase() {
	// Check if we're in a test/mock environment
	if os.Getenv("DB_MOCK") == "true" {
		fmt.Println("🔧 Running in mock database mode (DB_MOCK=true)")
		fmt.Println("⚠️  Database operations will be skipped")
		return
	}

	var database *gorm.DB
	var err error

	// Use Railway PostgreSQL variables or DATABASE_URL
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL != "" {
		// Use DATABASE_URL if available (Railway's preferred method)
		database, err = gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
		if err != nil {
			log.Fatal("Failed to connect to database via DATABASE_URL:", err)
		}
		fmt.Println("✅ Connected to PostgreSQL via DATABASE_URL successfully!")
	} else {
		// Fallback to individual environment variables
		dbHost := getEnv("PGHOST", "localhost")
		dbPort := getEnv("PGPORT", "5432")
		dbUser := getEnv("PGUSER", "postgres")
		dbPassword := getEnv("PGPASSWORD", "postgres")
		dbName := getEnv("PGDATABASE", "finance")

		// Use sslmode=disable for local development, require for production
		sslMode := getEnv("PGSSLMODE", "disable")
		if os.Getenv("RAILWAY_ENVIRONMENT") != "" || os.Getenv("DATABASE_URL") != "" {
			sslMode = "require" // Force SSL for Railway/production
		}
		dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
			dbHost, dbUser, dbPassword, dbName, dbPort, sslMode)
		database, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err != nil {
			log.Printf("❌ Failed to connect to database: %v", err)
			log.Println("💡 To run without database for testing, set DB_MOCK=true")
			log.Fatal("Database connection failed")
		}

		fmt.Println("✅ Connected to PostgreSQL successfully!")
	}

	DB = database

	// Handle migration for existing tables
	fmt.Println("🔄 Checking for existing data...")

	// Check if expenses table exists and has data
	var expenseCount int64
	database.Raw("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'expenses'").Scan(&expenseCount)

	if expenseCount > 0 {
		// Table exists, check for user_id column
		var columnCount int64
		database.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'user_id'").Scan(&columnCount)

		if columnCount == 0 {
			fmt.Println("🔧 Adding user_id columns to existing tables...")

			// Add user_id as nullable first
			database.Exec("ALTER TABLE expenses ADD COLUMN user_id bigint")
			database.Exec("ALTER TABLE budgets ADD COLUMN user_id bigint")

			// Create default user for existing data with proper PIN hash
			defaultPINHash, err := utils.HashPIN("9999") // Default PIN for migration user
			if err != nil {
				defaultPINHash = "migration-placeholder-hash" // Fallback
			}
			defaultUser := models.User{
				MobileNumber: "+919999999999",
				Name:         "Default User (Migration)",
				PIN:          defaultPINHash,
				IsVerified:   true,
			}
			database.Create(&defaultUser)

			// Update existing records
			database.Exec("UPDATE expenses SET user_id = ? WHERE user_id IS NULL", defaultUser.ID)
			database.Exec("UPDATE budgets SET user_id = ? WHERE user_id IS NULL", defaultUser.ID)

			fmt.Printf("✅ Updated existing records with default user ID: %d\n", defaultUser.ID)
		}
	}

	// Check and add PIN column to existing users table
	var pinColumnCount int64
	database.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'pin'").Scan(&pinColumnCount)

	if pinColumnCount == 0 {
		fmt.Println("🔧 Adding PIN column to users table...")

		// Add PIN column as nullable first
		if err := database.Exec("ALTER TABLE users ADD COLUMN pin text").Error; err != nil {
			log.Printf("Error adding PIN column: %v", err)
		}

		// Generate default PIN hash for existing users
		defaultPINHash, err := utils.HashPIN("0000") // Default PIN, users will need to reset
		if err != nil {
			log.Printf("Error generating default PIN hash: %v", err)
			defaultPINHash = "default:hash" // Fallback
		}

		// Update existing users with default PIN
		database.Exec("UPDATE users SET pin = ? WHERE pin IS NULL", defaultPINHash)

		// Now make PIN column NOT NULL
		database.Exec("ALTER TABLE users ALTER COLUMN pin SET NOT NULL")

		fmt.Println("✅ PIN column added and populated for existing users")
	}

	// Auto-migrate all models
	err = database.AutoMigrate(
		&models.User{},
		&models.OTPVerification{},
		&models.Expense{},
		&models.Budget{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	fmt.Println("✅ Database migration completed successfully!")
}
