//go:build debug
// +build debug

package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// User model
type User struct {
	ID           uint   `json:"id" gorm:"primaryKey"`
	Name         string `json:"name"`
	MobileNumber string `json:"mobile_number"`
	IsVerified   bool   `json:"is_verified"`
	CreatedAt    string `json:"created_at"`
	UpdatedAt    string `json:"updated_at"`
}

// OTPVerification model
type OTPVerification struct {
	ID           uint   `json:"id" gorm:"primaryKey"`
	MobileNumber string `json:"mobile_number"`
	OTPCode      string `json:"otp_code"`
	ExpiresAt    string `json:"expires_at"`
	IsUsed       bool   `json:"is_used"`
	CreatedAt    string `json:"created_at"`
}

var db *gorm.DB

func main() {
	// Database connection
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "password")
	dbName := getEnv("DB_NAME", "capify_db")

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		dbHost, dbUser, dbPassword, dbName, dbPort)

	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	fmt.Println("🔍 Database connected! Creating debug API...")

	gin.SetMode(gin.ReleaseMode)
	r := gin.New()

	// Debug endpoint to check users
	r.GET("/debug/users", func(c *gin.Context) {
		var users []User
		result := db.Find(&users)
		if result.Error != nil {
			c.JSON(500, gin.H{"error": result.Error.Error()})
			return
		}
		c.JSON(200, gin.H{
			"users": users,
			"count": len(users),
		})
	})

	// Debug endpoint to check OTPs
	r.GET("/debug/otps", func(c *gin.Context) {
		var otps []OTPVerification
		result := db.Order("created_at DESC").Limit(10).Find(&otps)
		if result.Error != nil {
			c.JSON(500, gin.H{"error": result.Error.Error()})
			return
		}
		c.JSON(200, gin.H{
			"otps":  otps,
			"count": len(otps),
		})
	})

	// Debug endpoint for specific mobile
	r.GET("/debug/user/:mobile", func(c *gin.Context) {
		mobile := c.Param("mobile")
		var user User
		result := db.Where("mobile_number = ?", mobile).First(&user)
		if result.Error != nil {
			c.JSON(404, gin.H{"error": "User not found", "mobile": mobile})
			return
		}
		c.JSON(200, gin.H{"user": user})
	})

	fmt.Println("🚀 Debug API running on http://localhost:8081")
	fmt.Println("📍 Endpoints:")
	fmt.Println("  • GET /debug/users - List all users")
	fmt.Println("  • GET /debug/otps - List recent OTPs")
	fmt.Println("  • GET /debug/user/8128209725 - Check specific user")

	log.Fatal(http.ListenAndServe(":8081", r))
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
