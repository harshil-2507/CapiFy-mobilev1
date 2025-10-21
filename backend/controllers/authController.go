package controllers

import (
	"finance-app-backend/config"
	"finance-app-backend/models"
	"finance-app-backend/utils"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AuthController struct {
	smsService utils.SMSService
}

func NewAuthController() *AuthController {
	return &AuthController{
		smsService: utils.GetSMSService(),
	}
}

// SendOTP sends OTP to mobile number
// @Summary Send OTP to mobile number
// @Description Send OTP for authentication to the provided mobile number
// @Tags auth
// @Accept json
// @Produce json
// @Param request body models.SendOTPRequest true "Mobile number"
// @Success 200 {object} models.OTPResponse
// @Failure 400 {object} map[string]interface{}
// @Router /auth/send-otp [post]
func (ac *AuthController) SendOTP(c *gin.Context) {
	var req models.SendOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request format",
			"error":   err.Error(),
		})
		return
	}

	// Validate mobile number
	if !utils.ValidateMobileNumber(req.MobileNumber) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid mobile number format. Please provide a valid Indian mobile number.",
		})
		return
	}

	// Normalize mobile number
	normalizedMobile := utils.NormalizeMobileNumber(req.MobileNumber)

	// Check for recent OTP requests (rate limiting)
	// Only block if there's an active, unverified OTP that hasn't expired
	var recentOTP models.OTPVerification
	result := config.DB.Where("mobile_number = ? AND is_verified = false AND expires_at > ?",
		normalizedMobile, time.Now()).
		Order("created_at DESC").First(&recentOTP)

	if result.Error == nil {
		// Check if it was created less than 1 minute ago (prevent spam)
		oneMinuteAgo := time.Now().Add(-1 * time.Minute)
		if recentOTP.CreatedAt.After(oneMinuteAgo) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"message": "Please wait 60 seconds before requesting another OTP.",
			})
			return
		}

		// If OTP is older than 1 minute but not expired, allow new OTP
		// and mark the old one as expired by updating it
		config.DB.Model(&recentOTP).Update("expires_at", time.Now())
	}

	// Generate OTP
	otpCode := utils.GenerateOTP()
	expiresAt := time.Now().Add(5 * time.Minute) // 5 minutes expiry

	// Save OTP to database
	otpRecord := models.OTPVerification{
		MobileNumber: normalizedMobile,
		OTPCode:      otpCode,
		ExpiresAt:    expiresAt,
		IsVerified:   false,
		AttemptCount: 0,
	}

	if err := config.DB.Create(&otpRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to generate OTP. Please try again.",
		})
		return
	}

	// Send OTP via SMS
	if err := ac.smsService.SendOTP(normalizedMobile, otpCode); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to send OTP. Please try again.",
		})
		return
	}

	c.JSON(http.StatusOK, models.OTPResponse{
		Success:   true,
		Message:   "OTP sent successfully to " + normalizedMobile,
		ExpiresIn: 300, // 5 minutes in seconds
	})
}

// VerifyOTP verifies OTP and creates/authenticates user
// @Summary Verify OTP and authenticate user
// @Description Verify the OTP sent to mobile number and create/authenticate user
// @Tags auth
// @Accept json
// @Produce json
// @Param request body models.VerifyOTPRequest true "OTP verification details"
// @Success 200 {object} models.AuthResponse
// @Failure 400 {object} map[string]interface{}
// @Router /auth/verify-otp [post]
func (ac *AuthController) VerifyOTP(c *gin.Context) {
	var req models.VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request format",
			"error":   err.Error(),
		})
		return
	}

	// Validate mobile number
	if !utils.ValidateMobileNumber(req.MobileNumber) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid mobile number format",
		})
		return
	}

	// Normalize mobile number
	normalizedMobile := utils.NormalizeMobileNumber(req.MobileNumber)

	// Find the most recent OTP for this mobile number
	var otpRecord models.OTPVerification
	result := config.DB.Where("mobile_number = ? AND is_verified = false", normalizedMobile).
		Order("created_at DESC").First(&otpRecord)

	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "No valid OTP found. Please request a new OTP.",
		})
		return
	}

	// Check if OTP has expired
	if time.Now().After(otpRecord.ExpiresAt) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "OTP has expired. Please request a new OTP.",
		})
		return
	}

	// Check attempt count (max 3 attempts)
	if otpRecord.AttemptCount >= 3 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Maximum OTP attempts exceeded. Please request a new OTP.",
		})
		return
	}

	// Verify OTP
	if otpRecord.OTPCode != req.OTPCode {
		// Increment attempt count
		config.DB.Model(&otpRecord).Update("attempt_count", otpRecord.AttemptCount+1)

		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid OTP. Please check and try again.",
		})
		return
	}

	// Mark OTP as verified
	config.DB.Model(&otpRecord).Updates(map[string]interface{}{
		"is_verified": true,
		"updated_at":  time.Now(),
	})

	// Check if user exists
	var user models.User
	userResult := config.DB.Where("mobile_number = ?", normalizedMobile).First(&user)

	if userResult.Error != nil {
		if userResult.Error == gorm.ErrRecordNotFound {
			// User doesn't exist, create new user
			if req.Name == "" {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Name is required for new user registration",
				})
				return
			}

			if req.PIN == "" {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "PIN is required for new user registration",
				})
				return
			}

			// Validate PIN
			if err := utils.ValidatePIN(req.PIN); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": err.Error(),
				})
				return
			}

			// Hash the PIN
			hashedPIN, err := utils.HashPIN(req.PIN)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Failed to secure PIN",
				})
				return
			}

			user = models.User{
				MobileNumber: normalizedMobile,
				Name:         req.Name,
				PIN:          hashedPIN,
				IsVerified:   true,
			}

			if err := config.DB.Create(&user).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Failed to create user account",
				})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Database error occurred",
			})
			return
		}
	} else {
		// User exists, mark as verified if not already
		if !user.IsVerified {
			config.DB.Model(&user).Update("is_verified", true)
			user.IsVerified = true
		}
	}

	// Generate JWT tokens
	accessToken, refreshToken, err := utils.GenerateTokenPair(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to generate authentication tokens",
		})
		return
	}

	// Return success response
	c.JSON(http.StatusOK, models.AuthResponse{
		Success:      true,
		Message:      "Authentication successful",
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         &user,
	})
}

// RefreshToken refreshes the access token using refresh token
// @Summary Refresh access token
// @Description Refresh access token using a valid refresh token
// @Tags auth
// @Accept json
// @Produce json
// @Param request body map[string]string true "Refresh token"
// @Success 200 {object} models.AuthResponse
// @Failure 400 {object} map[string]interface{}
// @Router /auth/refresh-token [post]
func (ac *AuthController) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Refresh token is required",
		})
		return
	}

	// Validate refresh token
	claims, err := utils.ValidateToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid or expired refresh token",
		})
		return
	}

	// Check if token is actually a refresh token
	if claims.Issuer != "capify-refresh" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid token type",
		})
		return
	}

	// Get user from database
	var user models.User
	if err := config.DB.First(&user, claims.UserID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not found",
		})
		return
	}

	// Generate new access token
	accessToken, err := utils.GenerateAccessToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to generate new access token",
		})
		return
	}

	c.JSON(http.StatusOK, models.AuthResponse{
		Success:     true,
		Message:     "Token refreshed successfully",
		AccessToken: accessToken,
		User:        &user,
	})
}

// GetProfile gets the authenticated user's profile
// @Summary Get user profile
// @Description Get the profile of the authenticated user
// @Tags auth
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} models.User
// @Failure 401 {object} map[string]interface{}
// @Router /auth/profile [get]
func (ac *AuthController) GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"user":    user,
	})
}

// Login authenticates user with mobile number and PIN
// @Summary Login with PIN
// @Description Authenticate user using mobile number and PIN
// @Tags auth
// @Accept json
// @Produce json
// @Param request body models.LoginRequest true "Login credentials"
// @Success 200 {object} models.AuthResponse
// @Failure 400 {object} gin.H
// @Failure 401 {object} gin.H
// @Router /auth/login [post]
func (ac *AuthController) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request format",
			"error":   err.Error(),
		})
		return
	}

	// Normalize mobile number
	normalizedMobile := utils.NormalizeMobileNumber(req.MobileNumber)

	// Validate PIN format
	if err := utils.ValidatePIN(req.PIN); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Find user by mobile number
	var user models.User
	result := config.DB.Where("mobile_number = ? AND is_verified = true", normalizedMobile).First(&user)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Invalid mobile number or PIN",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Database error",
			})
		}
		return
	}

	// Verify PIN
	isValidPIN, err := utils.VerifyPIN(req.PIN, user.PIN)
	if err != nil || !isValidPIN {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid mobile number or PIN",
		})
		return
	}

	// Generate JWT tokens
	accessToken, err := utils.GenerateAccessToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to generate access token",
		})
		return
	}

	refreshToken, err := utils.GenerateRefreshToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to generate refresh token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":       true,
		"message":       "Login successful",
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"user":          user,
	})
}

// ForgotPIN initiates PIN reset process by sending OTP
// @Summary Forgot PIN
// @Description Send OTP for PIN reset
// @Tags auth
// @Accept json
// @Produce json
// @Param request body models.ForgotPINRequest true "Mobile number"
// @Success 200 {object} models.OTPResponse
// @Failure 400 {object} gin.H
// @Router /auth/forgot-pin [post]
func (ac *AuthController) ForgotPIN(c *gin.Context) {
	var req models.ForgotPINRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request format",
			"error":   err.Error(),
		})
		return
	}

	// Normalize mobile number
	normalizedMobile := utils.NormalizeMobileNumber(req.MobileNumber)

	// Check if user exists and is verified
	var user models.User
	result := config.DB.Where("mobile_number = ? AND is_verified = true", normalizedMobile).First(&user)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "No account found with this mobile number",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Database error",
			})
		}
		return
	}

	// Check rate limiting (same as SendOTP)
	var recentOTP models.OTPVerification
	cutoffTime := time.Now().Add(-1 * time.Minute)
	result = config.DB.Where("mobile_number = ? AND created_at > ?", normalizedMobile, cutoffTime).
		Order("created_at DESC").First(&recentOTP)

	if result.Error == nil {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"success": false,
			"message": "Please wait before requesting another OTP",
		})
		return
	}

	// Generate and send OTP (same logic as SendOTP)
	otpCode := utils.GenerateOTP()
	expiresAt := time.Now().Add(5 * time.Minute)

	otpRecord := models.OTPVerification{
		MobileNumber: normalizedMobile,
		OTPCode:      otpCode,
		ExpiresAt:    expiresAt,
		IsVerified:   false,
		AttemptCount: 0,
	}

	if err := config.DB.Create(&otpRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to generate OTP. Please try again.",
		})
		return
	}

	// Send SMS
	err := ac.smsService.SendOTP(normalizedMobile, otpCode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to send OTP",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"message":    "OTP sent successfully for PIN reset",
		"expires_in": 300, // 5 minutes in seconds
	})
}

// ResetPIN resets user PIN after OTP verification
// @Summary Reset PIN
// @Description Reset user PIN with OTP verification
// @Tags auth
// @Accept json
// @Produce json
// @Param request body models.ResetPINRequest true "Reset PIN data"
// @Success 200 {object} gin.H
// @Failure 400 {object} gin.H
// @Router /auth/reset-pin [post]
func (ac *AuthController) ResetPIN(c *gin.Context) {
	var req models.ResetPINRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request format",
			"error":   err.Error(),
		})
		return
	}

	// Normalize mobile number
	normalizedMobile := utils.NormalizeMobileNumber(req.MobileNumber)

	// Validate new PIN
	if err := utils.ValidatePIN(req.NewPIN); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Verify OTP (same logic as VerifyOTP)
	var otpRecord models.OTPVerification
	result := config.DB.Where("mobile_number = ? AND otp_code = ? AND is_verified = false AND expires_at > ?",
		normalizedMobile, req.OTPCode, time.Now()).
		Order("created_at DESC").First(&otpRecord)

	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid or expired OTP",
		})
		return
	}

	// Mark OTP as verified
	otpRecord.IsVerified = true
	config.DB.Save(&otpRecord)

	// Find user and update PIN
	var user models.User
	result = config.DB.Where("mobile_number = ? AND is_verified = true", normalizedMobile).First(&user)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "User not found",
		})
		return
	}

	// Hash the new PIN
	hashedPIN, err := utils.HashPIN(req.NewPIN)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to secure PIN",
		})
		return
	}

	// Update user PIN
	user.PIN = hashedPIN
	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update PIN",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "PIN reset successfully",
	})
}
