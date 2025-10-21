package main

import (
	"finance-app-backend/config"
	"finance-app-backend/controllers"
	"finance-app-backend/routes"
	"fmt"
	"os"

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

	// Health check endpoint for Railway - simple and fast response
	r.GET("/", func(c *gin.Context) {
		c.Header("Content-Type", "application/json")
		c.String(200, `{"status":"ok","service":"capify-backend"}`)
	})

	// Additional health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.Header("Content-Type", "application/json")
		c.String(200, `{"status":"healthy","database":"connected"}`)
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

	// Get port from Railway environment variable or default to 8000
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	fmt.Printf("🚀 CapiFy Backend Server starting on :%s\n", port)
	fmt.Println("📱 Authentication endpoints:")
	fmt.Println("   POST /auth/send-otp")
	fmt.Println("   POST /auth/verify-otp")
	fmt.Println("   POST /auth/refresh-token")
	fmt.Println("   GET  /auth/profile")
	fmt.Println("🔍 Debug endpoints:")
	fmt.Println("   GET  /debug/users")
	fmt.Println("   GET  /debug/otps")
	fmt.Println("   GET  /debug/user/:mobile")
	r.Run("0.0.0.0:" + port)
}
