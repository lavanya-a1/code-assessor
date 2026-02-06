package models

import "time"

// Contest represents coding competitions
type Contest struct {
	ContestID       uint      `gorm:"primaryKey;autoIncrement" json:"contest_id"`
	CollegeID       *uint     `json:"college_id"`
	Title           string    `gorm:"size:200;not null" json:"title"`
	Description     string    `gorm:"type:text" json:"description"`
	StartTime       time.Time `gorm:"not null" json:"start_time"`
	EndTime         time.Time `gorm:"not null" json:"end_time"`
	IsPublic        bool      `gorm:"default:false" json:"is_public"`
	ShowLeaderboard bool      `gorm:"default:true" json:"show_leaderboard"`
	CreatedBy       uint      `json:"created_by"`
	CreatedAt       time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	College         *College  `gorm:"foreignKey:CollegeID" json:"college,omitempty"`
}

// ContestProblem maps problems to contests
type ContestProblem struct {
	ContestID  uint     `gorm:"primaryKey" json:"contest_id"`
	ProblemID  uint     `gorm:"primaryKey" json:"problem_id"`
	Points     int      `gorm:"default:100" json:"points"`
	OrderIndex int      `gorm:"default:0" json:"order_index"`
	Contest    *Contest `gorm:"foreignKey:ContestID;constraint:OnDelete:CASCADE" json:"contest,omitempty"`
	Problem    *Problem `gorm:"foreignKey:ProblemID;constraint:OnDelete:CASCADE" json:"problem,omitempty"`
}

// ContestParticipant represents users registered for a contest
type ContestParticipant struct {
	ContestID        uint       `gorm:"primaryKey" json:"contest_id"`
	UserID           uint       `gorm:"primaryKey" json:"user_id"`
	RegisteredAt     time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"registered_at"`
	TotalScore       int        `gorm:"default:0" json:"total_score"`
	LastSubmissionAt *time.Time `json:"last_submission_at"`
	Contest          *Contest   `gorm:"foreignKey:ContestID;constraint:OnDelete:CASCADE" json:"contest,omitempty"`
	User             *User      `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
}
