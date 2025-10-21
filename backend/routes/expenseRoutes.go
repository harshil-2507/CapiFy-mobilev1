package routes

import (
	"finance-app-backend/controllers"
	"finance-app-backend/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterExpenseRoutes(r *gin.Engine) {
	// Protected expense routes - require JWT authentication
	expenseGroup := r.Group("/expenses")
	expenseGroup.Use(middleware.AuthMiddleware())
	{
		expenseGroup.POST("", controllers.CreateExpense)
		expenseGroup.GET("", controllers.GetExpenses)
		expenseGroup.PUT("/:id", controllers.UpdateExpense)
		expenseGroup.DELETE("/:id", controllers.DeleteExpense)
	}
}
