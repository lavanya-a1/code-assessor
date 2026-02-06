package models

import "time"

// LabSession represents timed lab sessions
type LabSession struct {
	SessionID   uint      `gorm:"primaryKey;autoIncrement" json:"session_id"`
	CourseID    uint      `gorm:"not null" json:"course_id"`
	SectionID   *uint     `json:"section_id"` // NULL = all sections
	Title       string    `gorm:"size:200;not null" json:"title"`
	StartTime   time.Time `gorm:"not null" json:"start_time"`
	EndTime     time.Time `gorm:"not null" json:"end_time"`
	MaxAttempts int       `gorm:"default:0" json:"max_attempts"` // 0 = unlimited
	CreatedBy   uint      `json:"created_by"`
	CreatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	Course      *Course   `gorm:"foreignKey:CourseID;constraint:OnDelete:CASCADE" json:"course,omitempty"`
	Section     *Section  `gorm:"foreignKey:SectionID" json:"section,omitempty"`
}

// LabSessionProblem maps problems to lab sessions
type LabSessionProblem struct {
	SessionID  uint        `gorm:"primaryKey" json:"session_id"`
	ProblemID  uint        `gorm:"primaryKey" json:"problem_id"`
	OrderIndex int         `gorm:"default:0" json:"order_index"`
	Session    *LabSession `gorm:"foreignKey:SessionID;constraint:OnDelete:CASCADE" json:"session,omitempty"`
	Problem    *Problem    `gorm:"foreignKey:ProblemID;constraint:OnDelete:CASCADE" json:"problem,omitempty"`
}
