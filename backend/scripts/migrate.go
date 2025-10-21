package main

import (
	"finance-app-backend/config"
	"finance-app-backend/models"
	"fmt"
	"log"

	"gorm.io/gorm"
)

func main() {
	// Connect to database
	config.ConnectDatabase()

	fmt.Println("🔄 Starting database migration...")

	// Step 1: Check if expenses table exists and has data
	var count int64
	config.DB.Raw("SELECT COUNT(*) FROM expenses").Scan(&count)

	if count > 0 {
		fmt.Printf("📊 Found %d existing expenses records\n", count)

		// Step 2: Add user_id column as nullable first
		fmt.Println("🔧 Adding user_id column as nullable...")
		config.DB.Exec("ALTER TABLE expenses ADD COLUMN IF NOT EXISTS user_id bigint")

		// Step 3: Create a default user for existing expenses
		fmt.Println("👤 Creating default user for existing expenses...")
		defaultUser := models.User{
			MobileNumber: "+919999999999",
			Name:         "Default User",
			IsVerified:   true,
		}

		// Create or find default user
		var existingUser models.User
		result := config.DB.Where("mobile_number = ?", defaultUser.MobileNumber).First(&existingUser)
		if result.Error != nil {
			if result.Error == gorm.ErrRecordNotFound {
				config.DB.Create(&defaultUser)
				existingUser = defaultUser
				fmt.Printf("✅ Created default user with ID: %d\n", existingUser.ID)
			} else {
				log.Fatal("Error checking for default user:", result.Error)
			}
		} else {
			fmt.Printf("📋 Using existing default user with ID: %d\n", existingUser.ID)
		}

		// Step 4: Update all expenses without user_id to use default user
		fmt.Println("🔄 Updating existing expenses with default user...")
		updateResult := config.DB.Exec("UPDATE expenses SET user_id = ? WHERE user_id IS NULL", existingUser.ID)
		if updateResult.Error != nil {
			log.Fatal("Error updating expenses:", updateResult.Error)
		}
		fmt.Printf("✅ Updated %d expense records\n", updateResult.RowsAffected)

		// Step 5: Make user_id NOT NULL
		fmt.Println("🔒 Making user_id column NOT NULL...")
		config.DB.Exec("ALTER TABLE expenses ALTER COLUMN user_id SET NOT NULL")
	}

	// Step 6: Do the same for budgets if needed
	config.DB.Raw("SELECT COUNT(*) FROM budgets").Scan(&count)
	if count > 0 {
		fmt.Printf("📊 Found %d existing budget records\n", count)

		config.DB.Exec("ALTER TABLE budgets ADD COLUMN IF NOT EXISTS user_id bigint")

		// Get default user
		var defaultUser models.User
		config.DB.Where("mobile_number = ?", "+919999999999").First(&defaultUser)

		config.DB.Exec("UPDATE budgets SET user_id = ? WHERE user_id IS NULL", defaultUser.ID)
		config.DB.Exec("ALTER TABLE budgets ALTER COLUMN user_id SET NOT NULL")
		fmt.Println("✅ Updated budget records")
	}

	// Step 7: Run the full migration
	fmt.Println("🏗️  Running full auto-migration...")
	err := config.DB.AutoMigrate(
		&models.User{},
		&models.OTPVerification{},
		&models.Expense{},
		&models.Budget{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	fmt.Println("✅ Database migration completed successfully!")
	fmt.Println("🎉 Authentication system is ready!")
}
