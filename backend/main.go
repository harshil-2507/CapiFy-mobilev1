package main

import (
	"finance-app-backend/config"
	"finance-app-backend/controllers"
	"finance-app-backend/routes"
	"fmt"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	config.ConnectDatabase()
	r := gin.Default()

	// Configure CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"}, // Allow all origins for development
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"*"},
		AllowCredentials: true,
	}))

	// Health check endpoint for Railway
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Welcome to CapiFy Backend!",
			"status":  "healthy",
			"version": "1.0.0",
		})
	})

	// Additional health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":   "healthy",
			"database": "connected",
		})
	})

	// Register all routes
	routes.RegisterAuthRoutes(r)
	routes.RegisterExpenseRoutes(r)
	routes.RegisterBudgetRoutes(r)

	// Debug routes for development
	debugController := &controllers.DebugController{DB: config.DB}
	debug := r.Group("/debug")
	{
		debug.GET("/users", debugController.GetUsers)
		debug.GET("/otps", debugController.GetOTPs)
		debug.GET("/user/:mobile", debugController.GetUserByMobile)
	}

	fmt.Println("🚀 CapiFy Backend Server starting on :8000")
	fmt.Println("📱 Authentication endpoints:")
	fmt.Println("   POST /auth/send-otp")
	fmt.Println("   POST /auth/verify-otp")
	fmt.Println("   POST /auth/refresh-token")
	fmt.Println("   GET  /auth/profile")
	fmt.Println("🔍 Debug endpoints:")
	fmt.Println("   GET  /debug/users")
	fmt.Println("   GET  /debug/otps")
	fmt.Println("   GET  /debug/user/:mobile")
	r.Run(":8000")
}
