package controllers

import (
	"finance-app-backend/config"
	"finance-app-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Get user ID from JWT token
func getUserIDFromToken(c *gin.Context) (uint, error) {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0, gin.Error{Err: gin.Error{Type: gin.ErrorTypePublic}.Err}
	}
	return userID.(uint), nil
}

func GetExpenses(c *gin.Context) {
	// Get user ID from JWT token
	userID, err := getUserIDFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var expenses []models.Expense
	// Filter expenses by user ID
	config.DB.Where("user_id = ?", userID).Find(&expenses)
	c.JSON(http.StatusOK, gin.H{"expenses": expenses})
}

func CreateExpense(c *gin.Context) {
	// Get user ID from JWT token
	userID, err := getUserIDFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var expense models.Expense
	if err := c.ShouldBindJSON(&expense); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Assign the user ID to the expense
	expense.UserID = userID

	config.DB.Create(&expense)
	c.JSON(http.StatusCreated, gin.H{"expense": expense})
}

func DeleteExpense(c *gin.Context) {
	// Get user ID from JWT token
	userID, err := getUserIDFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id := c.Param("id")
	
	// First, check if expense exists and belongs to user
	var expense models.Expense
	result := config.DB.Where("id = ? AND user_id = ?", id, userID).First(&expense)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Expense not found or unauthorized"})
		return
	}

	// Delete the expense
	config.DB.Delete(&expense)
	c.JSON(http.StatusOK, gin.H{"message": "Expense deleted successfully"})
}

func UpdateExpense(c *gin.Context) {
	// Get user ID from JWT token
	userID, err := getUserIDFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id := c.Param("id")
	
	// First, check if expense exists and belongs to user
	var expense models.Expense
	result := config.DB.Where("id = ? AND user_id = ?", id, userID).First(&expense)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Expense not found or unauthorized"})
		return
	}

	// Bind the updated data
	var updatedExpense models.Expense
	if err := c.ShouldBindJSON(&updatedExpense); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Ensure user ID remains the same (security)
	updatedExpense.UserID = userID

	// Update the expense
	config.DB.Model(&expense).Updates(updatedExpense)
	c.JSON(http.StatusOK, gin.H{"expense": expense})
}
