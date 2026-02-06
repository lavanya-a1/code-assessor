package models

import (
	"time"

	"gorm.io/gorm"
)

// Submission represents a code submission
type Submission struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	UserID        uint           `gorm:"index" json:"user_id"`
	ProblemID     uint           `gorm:"index" json:"problem_id"`
	CourseID      *uint          `json:"course_id"`
	SectionID     *uint          `json:"section_id"`
	LabSessionID  *uint          `json:"lab_session_id"`
	ContestID     *uint          `json:"contest_id"`
	LanguageID    int            `json:"language_id"`
	SourceCode    string         `gorm:"type:text" json:"source_code"`
	Status        string         `gorm:"size:50" json:"status"`
	Passed        bool           `gorm:"default:false" json:"passed"`
	TotalTests    int            `json:"total_tests"`
	PassedTests   int            `json:"passed_tests"`
	ExecutionTime float64        `json:"execution_time"`
	MemoryUsed    int            `json:"memory_used"`
	ErrorMessage  string         `gorm:"type:text" json:"error_message,omitempty"`
	SubmittedAt   time.Time      `json:"submitted_at"`
	TimeSpent     float64        `json:"time_spent"` // time spent by user on a question in seconds
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	User       User        `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Problem    Problem     `gorm:"foreignKey:ProblemID" json:"problem,omitempty"`
	Course     *Course     `gorm:"foreignKey:CourseID" json:"course,omitempty"`
	Section    *Section    `gorm:"foreignKey:SectionID" json:"section,omitempty"`
	LabSession *LabSession `gorm:"foreignKey:LabSessionID" json:"lab_session,omitempty"`
	Contest    *Contest    `gorm:"foreignKey:ContestID" json:"contest,omitempty"`
}
