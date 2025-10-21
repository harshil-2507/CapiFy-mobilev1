package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// User model (simplified for checking)
type User struct {
	ID           uint   `json:"id" gorm:"primaryKey"`
	Name         string `json:"name"`
	MobileNumber string `json:"mobile_number"`
	IsVerified   bool   `json:"is_verified"`
	CreatedAt    string `json:"created_at"`
}

// OTPVerification model
type OTPVerification struct {
	ID           uint   `json:"id" gorm:"primaryKey"`
	MobileNumber string `json:"mobile_number"`
	OTPCode      string `json:"otp_code"`
	ExpiresAt    string `json:"expires_at"`
	IsVerified   bool   `json:"is_verified"`
	AttemptCount int    `json:"attempt_count"`
	CreatedAt    string `json:"created_at"`
}

func main() {
	// Load environment variables
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Database connection (using the same config as your main app)
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "postgres")
	dbName := getEnv("DB_NAME", "finance")

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		dbHost, dbUser, dbPassword, dbName, dbPort)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	fmt.Println("🔍 Checking CapiFy Database Contents...")
	fmt.Println("=====================================")

	// Check Users table
	var users []User
	result := db.Find(&users)
	if result.Error != nil {
		log.Printf("Error fetching users: %v", result.Error)
	} else {
		fmt.Printf("\n📱 USERS TABLE (%d records):\n", len(users))
		fmt.Println("┌────┬─────────────────┬─────────────────┬──────────┬─────────────────────┐")
		fmt.Println("│ ID │ Name            │ Mobile Number   │ Verified │ Created At          │")
		fmt.Println("├────┼─────────────────┼─────────────────┼──────────┼─────────────────────┤")

		for _, user := range users {
			verified := "❌"
			if user.IsVerified {
				verified = "✅"
			}
			fmt.Printf("│ %-2d │ %-15s │ %-15s │ %-8s │ %-19s │\n",
				user.ID, user.Name, user.MobileNumber, verified, user.CreatedAt[:19])
		}
		fmt.Println("└────┴─────────────────┴─────────────────┴──────────┴─────────────────────┘")
	}

	// Check OTP Verifications table
	var otps []OTPVerification
	result = db.Order("created_at DESC").Limit(10).Find(&otps)
	if result.Error != nil {
		log.Printf("Error fetching OTP records: %v", result.Error)
	} else {
		fmt.Printf("\n🔐 OTP VERIFICATIONS TABLE (last 10 records):\n")
		fmt.Println("┌────┬─────────────────┬─────────┬─────────────────────┬──────────┬─────────┬─────────────────────┐")
		fmt.Println("│ ID │ Mobile Number   │ OTP     │ Expires At          │ Verified │ Attempts│ Created At          │")
		fmt.Println("├────┼─────────────────┼─────────┼─────────────────────┼──────────┼─────────┼─────────────────────┤")

		for _, otp := range otps {
			verified := "❌"
			if otp.IsVerified {
				verified = "✅"
			}
			fmt.Printf("│ %-2d │ %-15s │ %-7s │ %-19s │ %-8s │ %-7d │ %-19s │\n",
				otp.ID, otp.MobileNumber, otp.OTPCode, otp.ExpiresAt[:19], verified, otp.AttemptCount, otp.CreatedAt[:19])
		}
		fmt.Println("└────┴─────────────────┴─────────┴─────────────────────┴──────┴─────────────────────┘")
	}

	// Check if your specific mobile number exists
	fmt.Printf("\n🔍 Searching for mobile number '+918128209725':\n")
	var specificUser User
	result = db.Where("mobile_number = ?", "+918128209725").First(&specificUser)
	if result.Error == nil {
		fmt.Printf("✅ Found user: %s (ID: %d, Verified: %v)\n",
			specificUser.Name, specificUser.ID, specificUser.IsVerified)
	} else {
		fmt.Printf("❌ User with mobile number '+918128209725' not found\n")

		// Also try without +91 prefix
		result = db.Where("mobile_number = ?", "8128209725").First(&specificUser)
		if result.Error == nil {
			fmt.Printf("✅ Found user with different format: %s (ID: %d, Verified: %v)\n",
				specificUser.Name, specificUser.ID, specificUser.IsVerified)
		}
	}

	fmt.Println("\n🎯 Database check complete!")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
