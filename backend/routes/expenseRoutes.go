package routes

import (
    "finance-app-backend/controllers"
    "github.com/gin-gonic/gin"
)

func RegisterExpenseRoutes(r *gin.Engine) {
    r.POST("/expenses", controllers.CreateExpense)
    r.GET("/expenses", controllers.GetExpenses)
}

