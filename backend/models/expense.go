package models

import "gorm.io/gorm"

type Expense struct {
    gorm.Model
    Title       string  `json:"title"`
    Amount      float64 `json:"amount"`
    Category    string  `json:"category"`
    Description string  `json:"description"`
}
