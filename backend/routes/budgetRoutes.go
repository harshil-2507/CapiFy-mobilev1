package routes

import (
	"finance-app-backend/controllers"

	"github.com/gin-gonic/gin"
)

func RegisterBudgetRoutes(r *gin.Engine) {
	// Budget analytics (must come before parameterized routes)
	r.GET("/budgets/summary", controllers.GetBudgetSummary)

	// Budget CRUD operations
	r.POST("/budgets", controllers.CreateBudget)
	r.GET("/budgets", controllers.GetBudgets)
	r.GET("/budgets/:id", controllers.GetBudgetByID)
	r.PUT("/budgets/:id", controllers.UpdateBudget)
	r.DELETE("/budgets/:id", controllers.DeleteBudget)
}
