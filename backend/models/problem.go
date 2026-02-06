package models

import (
	"time"

	"gorm.io/gorm"
)

// Problem represents coding problems for labs
type Problem struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	Title         string         `gorm:"size:200;not null" json:"title"`
	Description   string         `gorm:"type:text;not null" json:"description"`
	Difficulty    string         `gorm:"size:20;default:easy" json:"difficulty"` // easy, medium, hard
	Tags          string         `gorm:"size:500" json:"tags"`
	TimeLimit     int            `gorm:"default:2000" json:"time_limit"`     // in milliseconds
	MemoryLimit   int            `gorm:"default:256000" json:"memory_limit"` // in KB
	IsGlobal      bool           `gorm:"default:false" json:"is_global"`
	CollegeID     *uint          `json:"college_id"`
	CreatedBy     uint           `json:"created_by"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
	College       *College       `gorm:"foreignKey:CollegeID" json:"college,omitempty"`
	TestCases     []TestCase     `gorm:"constraint:OnDelete:CASCADE;foreignKey:ProblemID" json:"test_cases,omitempty"`
}