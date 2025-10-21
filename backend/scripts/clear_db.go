package main

import (
	"finance-app-backend/config"
	"log"
)

func main() {
	// Initialize database connection
	config.ConnectDatabase()

	log.Println("Clearing all user data from database...")

	// Clear all tables in the correct order (due to foreign key constraints)
	tables := []string{"expenses", "budgets", "otp_verifications", "users"}

	for _, table := range tables {
		result := config.DB.Exec("DELETE FROM " + table)
		if result.Error != nil {
			log.Printf("❌ Error clearing %s: %v", table, result.Error)
		} else {
			log.Printf("✅ Cleared %s table (%d rows affected)", table, result.RowsAffected)
		}
	}

	log.Println("🎉 Database cleared successfully! You can now register with any mobile number.")
}
