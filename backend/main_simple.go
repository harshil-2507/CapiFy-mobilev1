package main

import (
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

	fmt.Println("🔧 Starting CapiFy Backend (Simple Mode)...")
	fmt.Printf("Environment: PORT=%s, GIN_MODE=%s\n", os.Getenv("PORT"), gin.Mode())

	r := gin.Default()

	// Configure CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"*"},
		AllowCredentials: true,
	}))

	// Health check endpoint for Railway
	r.GET("/", func(c *gin.Context) {
		c.Header("Content-Type", "application/json")
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "capify-backend",
			"time":    fmt.Sprintf("%d", time.Now().Unix()),
			"message": "Backend is running successfully!",
		})
	})

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.Header("Content-Type", "application/json")
		c.JSON(200, gin.H{
			"status":   "healthy",
			"database": "not_connected_simple_mode",
			"time":     fmt.Sprintf("%d", time.Now().Unix()),
		})
	})

	// Mock auth endpoints for testing
	r.POST("/auth/send-otp", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"success": true,
			"message": "OTP sent successfully (mock)",
			"otp":     "1234", // For testing only
		})
	})

	r.POST("/auth/verify-otp", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"success":       true,
			"message":       "OTP verified successfully (mock)",
			"access_token":  "mock_access_token_12345",
			"refresh_token": "mock_refresh_token_12345",
			"user": gin.H{
				"id":     1,
				"name":   "Test User",
				"mobile": "+919999999999",
			},
		})
	})

	r.POST("/auth/login", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"success":       true,
			"message":       "Login successful (mock)",
			"access_token":  "mock_access_token_12345",
			"refresh_token": "mock_refresh_token_12345",
			"user": gin.H{
				"id":     1,
				"name":   "Test User",
				"mobile": "+919999999999",
			},
		})
	})

	// Get port from Railway environment variable or default to 8000
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	fmt.Printf("🚀 CapiFy Backend Server starting on :%s\n", port)
	fmt.Println("📱 Available endpoints:")
	fmt.Println("   GET  / (health)")
	fmt.Println("   GET  /health")
	fmt.Println("   POST /auth/send-otp (mock)")
	fmt.Println("   POST /auth/verify-otp (mock)")
	fmt.Println("   POST /auth/login (mock)")

	if err := r.Run("0.0.0.0:" + port); err != nil {
		fmt.Printf("❌ Failed to start server: %v\n", err)
		os.Exit(1)
	}
}
