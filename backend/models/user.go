package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User represents a platform user
type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Username  string         `gorm:"column:username;size:100;unique;not null" json:"username"`
	Email     string         `gorm:"size:100;unique;not null" json:"email"`
	Password  string         `gorm:"column:password;size:255;not null" json:"-"`
	Role      string         `gorm:"size:50;default:student" json:"role"` // student, faculty, hod, college_admin, super_admin
	RoleID    *uint          `json:"role_id,omitempty"`
	CollegeID *uint          `json:"college_id,omitempty"`
	BranchID  *uint          `json:"branch_id,omitempty"`
	Phone     string         `gorm:"size:15" json:"phone,omitempty"`
	IsActive  bool           `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	Branch *Branch `gorm:"foreignKey:BranchID" json:"branch,omitempty"`
	// Note: Foreign key constraints added manually to avoid circular dependency
}

// HashPassword hashes the user's password
func (u *User) HashPassword(password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	return nil
}

// CheckPassword compares the provided password with the hashed password
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}
