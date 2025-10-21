package models

import (
	"time"

	"gorm.io/gorm"
)

// Budget represents a spending limit for a category
type Budget struct {
	gorm.Model
	UserID    uint      `json:"user_id" gorm:"not null;index"`
	Category  string    `json:"category" gorm:"not null"`
	Amount    float64   `json:"amount" gorm:"not null"`
	Period    string    `json:"period" gorm:"default:'monthly'"` // monthly, weekly, custom
	StartDate time.Time `json:"start_date"`
	EndDate   time.Time `json:"end_date"`
	IsActive  bool      `json:"is_active" gorm:"default:true"`

	// Relationships
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// BudgetWithSpending includes current spending information
type BudgetWithSpending struct {
	Budget
	CurrentSpent float64 `json:"current_spent"`
	Remaining    float64 `json:"remaining"`
	Percentage   float64 `json:"percentage"`
	Status       string  `json:"status"` // safe, warning, danger
}
