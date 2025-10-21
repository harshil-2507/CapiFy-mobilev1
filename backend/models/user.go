package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	MobileNumber string         `json:"mobile_number" gorm:"uniqueIndex;not null"`
	Name         string         `json:"name" gorm:"not null"`
	PIN          string         `json:"-" gorm:"not null"` // Store hashed PIN, exclude from JSON
	IsVerified   bool           `json:"is_verified" gorm:"default:false"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
	
	// Relationships
	Expenses []Expense `json:"expenses,omitempty" gorm:"foreignKey:UserID"`
	Budgets  []Budget  `json:"budgets,omitempty" gorm:"foreignKey:UserID"`
}

type OTPVerification struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	MobileNumber string    `json:"mobile_number" gorm:"not null;index"`
	OTPCode      string    `json:"otp_code" gorm:"not null"`
	ExpiresAt    time.Time `json:"expires_at" gorm:"not null"`
	IsVerified   bool      `json:"is_verified" gorm:"default:false"`
	AttemptCount int       `json:"attempt_count" gorm:"default:0"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// CreateUserRequest represents the request payload for user registration  
type CreateUserRequest struct {
	MobileNumber string `json:"mobile_number" binding:"required" validate:"required,min=10,max=15"`
	Name         string `json:"name" binding:"required" validate:"required,min=2,max=100"`
	PIN          string `json:"pin" binding:"required" validate:"required,len=4"` // 4-digit PIN
}

// SendOTPRequest represents the request payload for sending OTP
type SendOTPRequest struct {
	MobileNumber string `json:"mobile_number" binding:"required" validate:"required,min=10,max=15"`
	PIN          string `json:"pin,omitempty" validate:"omitempty,len=4"` // Optional for registration
}

// VerifyOTPRequest represents the request payload for OTP verification (Registration)
type VerifyOTPRequest struct {
	MobileNumber string `json:"mobile_number" binding:"required" validate:"required,min=10,max=15"`
	OTPCode      string `json:"otp_code" binding:"required" validate:"required,len=6"`
	Name         string `json:"name" binding:"required" validate:"required,min=2,max=100"`
	PIN          string `json:"pin" binding:"required" validate:"required,len=4"`
}

// LoginRequest represents the request payload for PIN-based login
type LoginRequest struct {
	MobileNumber string `json:"mobile_number" binding:"required" validate:"required,min=10,max=15"`
	PIN          string `json:"pin" binding:"required" validate:"required,len=4"`
}

// ForgotPINRequest represents the request for PIN reset
type ForgotPINRequest struct {
	MobileNumber string `json:"mobile_number" binding:"required" validate:"required,min=10,max=15"`
}

// ResetPINRequest represents the request for setting new PIN after OTP verification
type ResetPINRequest struct {
	MobileNumber string `json:"mobile_number" binding:"required" validate:"required,min=10,max=15"`
	OTPCode      string `json:"otp_code" binding:"required" validate:"required,len=6"`
	NewPIN       string `json:"new_pin" binding:"required" validate:"required,len=4"`
}

// AuthResponse represents the authentication response
type AuthResponse struct {
	Success      bool   `json:"success"`
	Message      string `json:"message"`
	AccessToken  string `json:"access_token,omitempty"`
	RefreshToken string `json:"refresh_token,omitempty"`
	User         *User  `json:"user,omitempty"`
}

// OTPResponse represents the OTP sending response
type OTPResponse struct {
	Success   bool   `json:"success"`
	Message   string `json:"message"`
	ExpiresIn int    `json:"expires_in"` // seconds
}
