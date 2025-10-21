package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// Test data structures
type TestExpense struct {
	Title       string  `json:"title"`
	Amount      float64 `json:"amount"`
	Category    string  `json:"category"`
	Description string  `json:"description"`
}

type TestBudget struct {
	Category string  `json:"category"`
	Amount   float64 `json:"amount"`
	Period   string  `json:"period"`
}

func TestNotifications() {
	baseURL := "http://localhost:8080"

	fmt.Println("🧪 Testing Budget Notifications System")
	fmt.Println("=====================================")

	// Wait for server to be ready
	fmt.Println("⏳ Waiting for server to be ready...")
	time.Sleep(3 * time.Second)

	// Test 1: Create budgets
	fmt.Println("\n📝 Step 1: Creating test budgets...")
	budgets := []TestBudget{
		{Category: "Food", Amount: 5000, Period: "monthly"},
		{Category: "Transportation", Amount: 2000, Period: "monthly"},
		{Category: "Adventure", Amount: 1000, Period: "monthly"},
		{Category: "Shopping", Amount: 3000, Period: "monthly"},
	}

	for _, budget := range budgets {
		createBudget(baseURL, budget)
	}

	// Test 2: Add expenses to trigger different alert types
	fmt.Println("\n💸 Step 2: Adding expenses to trigger notifications...")

	// Safe budget (Food - under 50%)
	expenses := []TestExpense{
		{Title: "Lunch", Amount: 500, Category: "Food", Description: "Daily lunch"},
		{Title: "Groceries", Amount: 1500, Category: "Food", Description: "Weekly groceries"},
	}

	// Warning budget (Transportation - 70-80%)
	expenses = append(expenses, []TestExpense{
		{Title: "Bus Pass", Amount: 800, Category: "Transportation", Description: "Monthly bus pass"},
		{Title: "Uber", Amount: 600, Category: "Transportation", Description: "Uber rides"},
	}...)

	// Danger budget (Adventure - over 100%)
	expenses = append(expenses, []TestExpense{
		{Title: "Movie", Amount: 500, Category: "Adventure", Description: "Movie night"},
		{Title: "Trip", Amount: 1500, Category: "Adventure", Description: "Weekend trip"},
		{Title: "Concert", Amount: 2000, Category: "Adventure", Description: "Concert tickets"},
	}...)

	// Add expenses with delays to see real-time updates
	for i, expense := range expenses {
		fmt.Printf("   Adding expense %d/%d: %s - ₹%.2f (%s)\n", i+1, len(expenses), expense.Title, expense.Amount, expense.Category)
		createExpense(baseURL, expense)
		time.Sleep(1 * time.Second) // Small delay between expenses
	}

	fmt.Println("\n✅ Test data created successfully!")
	fmt.Println("\n🔔 NOTIFICATION TESTING GUIDE:")
	fmt.Println("=====================================")
	fmt.Println("1. Open your mobile app")
	fmt.Println("2. Look for the budget button (💰) in the header")
	fmt.Println("3. You should see a RED ALERT BADGE with number '1' (Adventure over budget)")
	fmt.Println("4. Tap the budget button to see all notifications")
	fmt.Println("5. Tap the insights button (📈) to see analytics")
	fmt.Println("")
	fmt.Println("Expected Notifications:")
	fmt.Println("🚨 Adventure Over Budget! (DANGER - Red)")
	fmt.Println("⚠️  Transportation Budget Warning (WARNING - Orange)")
	fmt.Println("✅ Food On Track (SUCCESS - Green)")
	fmt.Println("")
	fmt.Println("🧪 Test completed! Check your mobile app now.")
}

func createBudget(baseURL string, budget TestBudget) {
	url := baseURL + "/budgets"
	jsonData, _ := json.Marshal(budget)

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("❌ Failed to create budget %s: %v\n", budget.Category, err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == 201 {
		fmt.Printf("✅ Created budget: %s - ₹%.2f\n", budget.Category, budget.Amount)
	} else if resp.StatusCode == 409 {
		fmt.Printf("ℹ️  Budget already exists: %s\n", budget.Category)
	} else {
		fmt.Printf("❌ Failed to create budget %s: HTTP %d\n", budget.Category, resp.StatusCode)
	}
}

func createExpense(baseURL string, expense TestExpense) {
	url := baseURL + "/expenses"
	jsonData, _ := json.Marshal(expense)

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("❌ Failed to create expense %s: %v\n", expense.Title, err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != 201 {
		fmt.Printf("❌ Failed to create expense %s: HTTP %d\n", expense.Title, resp.StatusCode)
	}
}
