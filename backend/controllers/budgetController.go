package controllers

import (
	"finance-app-backend/config"
	"finance-app-backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CreateBudget creates a new budget for a category
func CreateBudget(c *gin.Context) {
	var budget models.Budget
	if err := c.ShouldBindJSON(&budget); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default dates for monthly budget if not provided
	if budget.Period == "monthly" && budget.StartDate.IsZero() {
		now := time.Now()
		budget.StartDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		budget.EndDate = budget.StartDate.AddDate(0, 1, -1) // Last day of month
	}

	// Check if budget already exists for this category and period
	var existingBudget models.Budget
	result := config.DB.Where("category = ? AND is_active = ? AND start_date <= ? AND end_date >= ?",
		budget.Category, true, time.Now(), time.Now()).First(&existingBudget)

	if result.Error == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Budget already exists for this category and period"})
		return
	}

	budget.IsActive = true
	config.DB.Create(&budget)
	c.JSON(http.StatusOK, budget)
}

// GetBudgets retrieves all active budgets with spending information
func GetBudgets(c *gin.Context) {
	var budgets []models.Budget
	config.DB.Where("is_active = ?", true).Find(&budgets)

	var budgetsWithSpending []models.BudgetWithSpending

	for _, budget := range budgets {
		budgetWithSpending := models.BudgetWithSpending{
			Budget: budget,
		}

		// Calculate current spending for this budget period and category
		var totalSpent float64
		config.DB.Model(&models.Expense{}).
			Where("category = ? AND created_at >= ? AND created_at <= ?",
				budget.Category, budget.StartDate, budget.EndDate).
			Select("COALESCE(SUM(amount), 0)").
			Row().Scan(&totalSpent)

		budgetWithSpending.CurrentSpent = totalSpent
		budgetWithSpending.Remaining = budget.Amount - totalSpent

		if budget.Amount > 0 {
			budgetWithSpending.Percentage = (totalSpent / budget.Amount) * 100
		}

		// Determine status
		if budgetWithSpending.Percentage >= 100 {
			budgetWithSpending.Status = "danger"
		} else if budgetWithSpending.Percentage >= 75 {
			budgetWithSpending.Status = "warning"
		} else {
			budgetWithSpending.Status = "safe"
		}

		budgetsWithSpending = append(budgetsWithSpending, budgetWithSpending)
	}

	c.JSON(http.StatusOK, budgetsWithSpending)
}

// GetBudgetByID retrieves a specific budget with spending information
func GetBudgetByID(c *gin.Context) {
	id := c.Param("id")
	var budget models.Budget

	if err := config.DB.First(&budget, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Budget not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	budgetWithSpending := models.BudgetWithSpending{
		Budget: budget,
	}

	// Calculate current spending
	var totalSpent float64
	config.DB.Model(&models.Expense{}).
		Where("category = ? AND created_at >= ? AND created_at <= ?",
			budget.Category, budget.StartDate, budget.EndDate).
		Select("COALESCE(SUM(amount), 0)").
		Row().Scan(&totalSpent)

	budgetWithSpending.CurrentSpent = totalSpent
	budgetWithSpending.Remaining = budget.Amount - totalSpent

	if budget.Amount > 0 {
		budgetWithSpending.Percentage = (totalSpent / budget.Amount) * 100
	}

	// Determine status
	if budgetWithSpending.Percentage >= 100 {
		budgetWithSpending.Status = "danger"
	} else if budgetWithSpending.Percentage >= 75 {
		budgetWithSpending.Status = "warning"
	} else {
		budgetWithSpending.Status = "safe"
	}

	c.JSON(http.StatusOK, budgetWithSpending)
}

// UpdateBudget updates an existing budget
func UpdateBudget(c *gin.Context) {
	id := c.Param("id")
	var budget models.Budget

	if err := config.DB.First(&budget, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Budget not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var updateData models.Budget
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update budget fields
	budget.Amount = updateData.Amount
	budget.Category = updateData.Category
	budget.Period = updateData.Period

	if !updateData.StartDate.IsZero() {
		budget.StartDate = updateData.StartDate
	}
	if !updateData.EndDate.IsZero() {
		budget.EndDate = updateData.EndDate
	}

	config.DB.Save(&budget)
	c.JSON(http.StatusOK, budget)
}

// DeleteBudget soft deletes a budget (sets is_active to false)
func DeleteBudget(c *gin.Context) {
	id := c.Param("id")
	var budget models.Budget

	if err := config.DB.First(&budget, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Budget not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	budget.IsActive = false
	config.DB.Save(&budget)
	c.JSON(http.StatusOK, gin.H{"message": "Budget deleted successfully"})
}

// GetBudgetSummary provides overall budget vs spending summary
func GetBudgetSummary(c *gin.Context) {
	var budgets []models.Budget
	config.DB.Where("is_active = ?", true).Find(&budgets)

	summary := gin.H{
		"total_budgets":       len(budgets),
		"total_budget_amount": 0.0,
		"total_spent":         0.0,
		"budgets_over_limit":  0,
		"budgets_warning":     0,
		"budgets_safe":        0,
	}

	var totalBudgetAmount, totalSpent float64
	var overLimit, warning, safe int

	for _, budget := range budgets {
		totalBudgetAmount += budget.Amount

		var categorySpent float64
		config.DB.Model(&models.Expense{}).
			Where("category = ? AND created_at >= ? AND created_at <= ?",
				budget.Category, budget.StartDate, budget.EndDate).
			Select("COALESCE(SUM(amount), 0)").
			Row().Scan(&categorySpent)

		totalSpent += categorySpent

		percentage := (categorySpent / budget.Amount) * 100
		if percentage >= 100 {
			overLimit++
		} else if percentage >= 75 {
			warning++
		} else {
			safe++
		}
	}

	summary["total_budget_amount"] = totalBudgetAmount
	summary["total_spent"] = totalSpent
	summary["budgets_over_limit"] = overLimit
	summary["budgets_warning"] = warning
	summary["budgets_safe"] = safe
	summary["overall_percentage"] = (totalSpent / totalBudgetAmount) * 100

	c.JSON(http.StatusOK, summary)
}
