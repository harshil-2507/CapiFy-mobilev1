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

	fmt.Println("🔧 Starting CapiFy Backend (No DB Test)...")
	fmt.Printf("Environment: PORT=%s, GIN_MODE=%s\n", os.Getenv("PORT"), gin.Mode())

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

	// Additional health check endpoint (no DB required)
	r.GET("/health", func(c *gin.Context) {
		c.Header("Content-Type", "application/json")
		c.JSON(200, gin.H{
			"status":   "healthy",
			"database": "not_connected_in_test",
			"time":     fmt.Sprintf("%d", time.Now().Unix()),
		})
	})

	// Get port from Railway environment variable or default to 8000
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	fmt.Printf("🚀 CapiFy Backend Server starting on :%s\n", port)
	fmt.Println("📱 Test endpoints:")
	fmt.Println("   GET  /")
	fmt.Println("   GET  /health")
	r.Run("0.0.0.0:" + port)
}
