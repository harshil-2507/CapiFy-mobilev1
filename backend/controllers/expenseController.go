package controllers

import (
	"finance-app-backend/config"
	"finance-app-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreateExpense(c *gin.Context) {
	var expense models.Expense
	if err := c.ShouldBindJSON(&expense); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config.DB.Create(&expense)
	c.JSON(http.StatusOK, expense)
}

func GetExpenses(c *gin.Context) {
	var expenses []models.Expense
	config.DB.Find(&expenses)
	c.JSON(http.StatusOK, expenses)
}

func DeleteExpense(c *gin.Context) {
	id := c.Param("id")

	var expense models.Expense
	if err := config.DB.First(&expense, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Expense not found"})
		return
	}

	config.DB.Delete(&expense)
	c.JSON(http.StatusOK, gin.H{"message": "Expense deleted successfully"})
}

func UpdateExpense(c *gin.Context) {
	id := c.Param("id")

	var expense models.Expense
	if err := config.DB.First(&expense, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Expense not found"})
		return
	}

	if err := c.ShouldBindJSON(&expense); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config.DB.Save(&expense)
	c.JSON(http.StatusOK, expense)
}
