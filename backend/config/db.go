package config

import (
    "fmt"
    "log"
	"finance-app-backend/models"
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
	database.AutoMigrate(&models.Expense{})

}
