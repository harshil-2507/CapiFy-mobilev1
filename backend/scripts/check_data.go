package main

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Define the Expense model (same as in your models/expense.go)
type Expense struct {
	ID          uint    `json:"ID" gorm:"primaryKey"`
	CreatedAt   string  `json:"CreatedAt"`
	UpdatedAt   string  `json:"UpdatedAt"`
	DeletedAt   *string `json:"DeletedAt"`
	Title       string  `json:"title"`
	Amount      float64 `json:"amount"`
	Category    string  `json:"category"`
	Description string  `json:"description"`
}

func main() {
	// Connect to database using same config as your app
	dsn := "host=localhost user=postgres password=postgres dbname=finance port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	fmt.Println("✅ Connected to PostgreSQL successfully!")

	// Check if expenses table exists and get count
	var count int64
	result := db.Model(&Expense{}).Count(&count)
	if result.Error != nil {
		fmt.Printf("❌ Error counting expenses: %v\n", result.Error)
		return
	}

	fmt.Printf("📊 Total expenses in database: %d\n", count)

	// Get all expenses
	var expenses []Expense
	result = db.Find(&expenses)
	if result.Error != nil {
		fmt.Printf("❌ Error fetching expenses: %v\n", result.Error)
		return
	}

	if len(expenses) == 0 {
		fmt.Println("📝 No expenses found in the database")
		return
	}

	// Display all expenses
	fmt.Println("\n💰 All Expenses:")
	fmt.Println("ID | Title | Amount | Category | Description | Created At")
	fmt.Println("---|-------|--------|----------|-------------|------------")

	for _, expense := range expenses {
		fmt.Printf("%d | %s | $%.2f | %s | %s | %s\n",
			expense.ID,
			expense.Title,
			expense.Amount,
			expense.Category,
			expense.Description,
			expense.CreatedAt)
	}

	// Get summary by category
	type CategorySum struct {
		Category string
		Total    float64
		Count    int64
	}

	var categorySums []CategorySum
	db.Model(&Expense{}).
		Select("category, SUM(amount) as total, COUNT(*) as count").
		Group("category").
		Find(&categorySums)

	if len(categorySums) > 0 {
		fmt.Println("\n📈 Summary by Category:")
		fmt.Println("Category | Total Amount | Count")
		fmt.Println("---------|--------------|------")

		for _, sum := range categorySums {
			fmt.Printf("%s | $%.2f | %d\n", sum.Category, sum.Total, sum.Count)
		}
	}
}
