package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type DebugController struct {
	DB *gorm.DB
}

// GetUsers returns all users for debugging
func (dc *DebugController) GetUsers(c *gin.Context) {
	type UserDebug struct {
		ID           uint   `json:"id"`
		Name         string `json:"name"`
		MobileNumber string `json:"mobile_number"`
		IsVerified   bool   `json:"is_verified"`
		CreatedAt    string `json:"created_at"`
		UpdatedAt    string `json:"updated_at"`
	}

	var users []UserDebug
	result := dc.DB.Table("users").Select("id, name, mobile_number, is_verified, created_at, updated_at").Find(&users)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch users",
			"error":   result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"count":   len(users),
		"users":   users,
	})
}

// GetOTPs returns recent OTP records for debugging
func (dc *DebugController) GetOTPs(c *gin.Context) {
	type OTPDebug struct {
		ID           uint   `json:"id"`
		MobileNumber string `json:"mobile_number"`
		OTPCode      string `json:"otp_code"`
		ExpiresAt    string `json:"expires_at"`
		IsVerified   bool   `json:"is_verified"`
		AttemptCount int    `json:"attempt_count"`
		CreatedAt    string `json:"created_at"`
	}

	var otps []OTPDebug
	result := dc.DB.Table("otp_verifications").
		Select("id, mobile_number, otp_code, expires_at, is_verified, attempt_count, created_at").
		Order("created_at DESC").
		Limit(10).
		Find(&otps)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch OTP records",
			"error":   result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"count":   len(otps),
		"otps":    otps,
	})
}

// GetUserByMobile returns user by mobile number
func (dc *DebugController) GetUserByMobile(c *gin.Context) {
	mobile := c.Param("mobile")

	type UserDebug struct {
		ID           uint   `json:"id"`
		Name         string `json:"name"`
		MobileNumber string `json:"mobile_number"`
		IsVerified   bool   `json:"is_verified"`
		CreatedAt    string `json:"created_at"`
		UpdatedAt    string `json:"updated_at"`
	}

	var user UserDebug
	result := dc.DB.Table("users").
		Select("id, name, mobile_number, is_verified, created_at, updated_at").
		Where("mobile_number = ?", mobile).
		First(&user)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "User not found",
				"mobile":  mobile,
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Database error",
				"error":   result.Error.Error(),
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"user":    user,
	})
}
