package models

import "gorm.io/gorm"

type Expense struct {
	gorm.Model
	UserID      uint    `json:"user_id" gorm:"not null;index"`
	Title       string  `json:"title"`
	Amount      float64 `json:"amount"`
	Category    string  `json:"category"`
	Description string  `json:"description"`

	// Relationships
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}
