package models

import (
	"time"

	"gorm.io/gorm"
)

// UserStreak tracks user submission streaks
type UserStreak struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	UserID           uint           `gorm:"uniqueIndex" json:"user_id"`
	CurrentStreak    int            `gorm:"default:0" json:"current_streak"`
	LongestStreak    int            `gorm:"default:0" json:"longest_streak"`
	LastActivityDate time.Time      `json:"last_activity_date"`
	TotalPoints      int            `gorm:"default:0" json:"total_points"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// UserActivity tracks daily activity for heatmap
type UserActivity struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index:idx_user_date,unique" json:"user_id"`
	Date      time.Time `gorm:"index:idx_user_date,unique;type:date" json:"date"`
	Count     int       `gorm:"default:0" json:"count"` // Number of submissions
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
