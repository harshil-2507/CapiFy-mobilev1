package routes

import (
	"finance-app-backend/controllers"
	"finance-app-backend/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterAuthRoutes(r *gin.Engine) {
	authController := controllers.NewAuthController()

	// Public auth routes (no authentication required)
	authGroup := r.Group("/auth")
	{
		authGroup.POST("/send-otp", authController.SendOTP)
		authGroup.POST("/verify-otp", authController.VerifyOTP)
		authGroup.POST("/refresh-token", authController.RefreshToken)
	}

	// Protected auth routes (require authentication)
	protectedAuthGroup := r.Group("/auth")
	protectedAuthGroup.Use(middleware.AuthMiddleware())
	{
		protectedAuthGroup.GET("/profile", authController.GetProfile)
	}
}
