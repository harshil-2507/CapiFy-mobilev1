package main

import (
	"finance-app-backend/config"
	"finance-app-backend/controllers"
	"finance-app-backend/routes"
	"fmt"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Set Gin to release mode for production
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	fmt.Println("🔧 Starting CapiFy Backend...")
	fmt.Printf("Environment: PORT=%s, GIN_MODE=%s\n", os.Getenv("PORT"), gin.Mode())

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
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "capify-backend",
			"time":    fmt.Sprintf("%d", time.Now().Unix()),
		})
	})

	// Additional health check endpoint with database ping
	r.GET("/health", func(c *gin.Context) {
		c.Header("Content-Type", "application/json")

		// Check if we're in mock mode
		if os.Getenv("DB_MOCK") == "true" {
			c.JSON(200, gin.H{
				"status":   "healthy",
				"database": "mock_mode",
				"time":     fmt.Sprintf("%d", time.Now().Unix()),
			})
			return
		}

		// Check database connection
		if config.DB == nil {
			c.JSON(500, gin.H{
				"status":   "unhealthy",
				"database": "not_initialized",
				"error":    "Database connection not established",
			})
			return
		}

		sqlDB, err := config.DB.DB()
		if err != nil {
			c.JSON(500, gin.H{
				"status":   "unhealthy",
				"database": "error getting database instance",
				"error":    err.Error(),
			})
			return
		}

		if err := sqlDB.Ping(); err != nil {
			c.JSON(500, gin.H{
				"status":   "unhealthy",
				"database": "ping failed",
				"error":    err.Error(),
			})
			return
		}

		c.JSON(200, gin.H{
			"status":   "healthy",
			"database": "connected",
			"time":     fmt.Sprintf("%d", time.Now().Unix()),
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
