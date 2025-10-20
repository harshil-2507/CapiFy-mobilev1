package controllers

import (
    "finance-app-backend/config"
    "finance-app-backend/models"
    "github.com/gin-gonic/gin"
    "net/http"
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
