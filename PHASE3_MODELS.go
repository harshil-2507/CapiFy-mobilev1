package models

import (
	"time"

	"gorm.io/gorm"
)

// Backend Models for Multi-User System

// User Model
type User struct {
	gorm.Model
	Email       string     `json:"email" gorm:"unique;not null"`
	Password    string     `json:"-" gorm:"not null"` // Hidden from JSON
	FirstName   string     `json:"first_name"`
	LastName    string     `json:"last_name"`
	Phone       string     `json:"phone"`
	Avatar      string     `json:"avatar"`
	IsActive    bool       `json:"is_active" gorm:"default:true"`
	LastLoginAt *time.Time `json:"last_login_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

	// Relationships
	Groups   []Group   `json:"groups" gorm:"many2many:user_groups;"`
	Expenses []Expense `json:"expenses" gorm:"foreignKey:UserID"`
}

// Group Model (Splitwise-like)
type Group struct {
	gorm.Model
	Name        string `json:"name" gorm:"not null"`
	Description string `json:"description"`
	Avatar      string `json:"avatar"`
	Currency    string `json:"currency" gorm:"default:INR"`
	CreatedBy   uint   `json:"created_by"`
	IsActive    bool   `json:"is_active" gorm:"default:true"`

	// Relationships
	Members  []User          `json:"members" gorm:"many2many:user_groups;"`
	Expenses []SharedExpense `json:"expenses" gorm:"foreignKey:GroupID"`
	Balances []GroupBalance  `json:"balances" gorm:"foreignKey:GroupID"`
}

// Shared Expense Model
type SharedExpense struct {
	gorm.Model
	GroupID     uint      `json:"group_id" gorm:"not null"`
	PaidBy      uint      `json:"paid_by" gorm:"not null"` // User ID
	Title       string    `json:"title" gorm:"not null"`
	Amount      float64   `json:"amount" gorm:"not null"`
	Category    string    `json:"category"`
	Description string    `json:"description"`
	Date        time.Time `json:"date"`
	Receipt     string    `json:"receipt"` // Image URL

	// Relationships
	Group      Group          `json:"group" gorm:"foreignKey:GroupID"`
	PaidByUser User           `json:"paid_by_user" gorm:"foreignKey:PaidBy"`
	Splits     []ExpenseSplit `json:"splits" gorm:"foreignKey:SharedExpenseID"`
}

// Expense Split Model
type ExpenseSplit struct {
	gorm.Model
	SharedExpenseID uint    `json:"shared_expense_id"`
	UserID          uint    `json:"user_id"`
	Amount          float64 `json:"amount"`
	Percentage      float64 `json:"percentage"`
	SplitType       string  `json:"split_type"` // "equal", "percentage", "custom"
	IsSettled       bool    `json:"is_settled" gorm:"default:false"`

	// Relationships
	User          User          `json:"user" gorm:"foreignKey:UserID"`
	SharedExpense SharedExpense `json:"shared_expense" gorm:"foreignKey:SharedExpenseID"`
}

// Group Balance Model (Who owes whom)
type GroupBalance struct {
	gorm.Model
	GroupID  uint    `json:"group_id"`
	FromUser uint    `json:"from_user"` // Who owes
	ToUser   uint    `json:"to_user"`   // Who is owed
	Amount   float64 `json:"amount"`

	// Relationships
	Group        Group `json:"group" gorm:"foreignKey:GroupID"`
	FromUserData User  `json:"from_user_data" gorm:"foreignKey:FromUser"`
	ToUserData   User  `json:"to_user_data" gorm:"foreignKey:ToUser"`
}

// Settlement Record
type Settlement struct {
	gorm.Model
	GroupID   uint      `json:"group_id"`
	FromUser  uint      `json:"from_user"`
	ToUser    uint      `json:"to_user"`
	Amount    float64   `json:"amount"`
	Method    string    `json:"method"` // "cash", "upi", "bank_transfer"
	Note      string    `json:"note"`
	SettledAt time.Time `json:"settled_at"`

	// Relationships
	Group        Group `json:"group" gorm:"foreignKey:GroupID"`
	FromUserData User  `json:"from_user_data" gorm:"foreignKey:FromUser"`
	ToUserData   User  `json:"to_user_data" gorm:"foreignKey:ToUser"`
}
