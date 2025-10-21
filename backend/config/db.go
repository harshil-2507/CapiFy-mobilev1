package config

import (
	"finance-app-backend/models"
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() {
	dsn := "host=localhost user=postgres password=postgres dbname=finance port=5432 sslmode=disable"
	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	fmt.Println("✅ Connected to PostgreSQL successfully!")
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

			// Create default user for existing data
			defaultUser := models.User{
				MobileNumber: "+919999999999",
				Name:         "Default User (Migration)",
				IsVerified:   true,
			}
			database.Create(&defaultUser)

			// Update existing records
			database.Exec("UPDATE expenses SET user_id = ? WHERE user_id IS NULL", defaultUser.ID)
			database.Exec("UPDATE budgets SET user_id = ? WHERE user_id IS NULL", defaultUser.ID)

			fmt.Printf("✅ Updated existing records with default user ID: %d\n", defaultUser.ID)
		}
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
