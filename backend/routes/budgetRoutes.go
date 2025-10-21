package routes

import (
	"finance-app-backend/controllers"
	"finance-app-backend/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterBudgetRoutes(r *gin.Engine) {
	// Protected budget routes - require JWT authentication
	budgetGroup := r.Group("/budgets")
	budgetGroup.Use(middleware.AuthMiddleware())
	{
		// Budget analytics (must come before parameterized routes)
		budgetGroup.GET("/summary", controllers.GetBudgetSummary)

		// Budget CRUD operations
		budgetGroup.POST("", controllers.CreateBudget)
		budgetGroup.GET("", controllers.GetBudgets)
		budgetGroup.GET("/:id", controllers.GetBudgetByID)
		budgetGroup.PUT("/:id", controllers.UpdateBudget)
		budgetGroup.DELETE("/:id", controllers.DeleteBudget)
	}
}
