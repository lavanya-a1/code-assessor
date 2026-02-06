package models

import "time"

// Course represents theory or lab courses
type Course struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	CourseCode string    `gorm:"size:20;not null" json:"course_code"`
	CourseName string    `gorm:"size:200;not null" json:"course_name"`
	CourseType string    `gorm:"size:20;not null" json:"course_type"` // 'theory' or 'lab'
	Credits    int       `gorm:"default:3" json:"credits"`
	SemesterID uint      `gorm:"not null" json:"semester_id"`
	BranchID   uint      `gorm:"not null" json:"branch_id"`
	CreatedBy  uint      `json:"created_by"`
	IsActive   bool      `gorm:"default:true" json:"is_active"`
	CreatedAt  time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	Semester   *Semester `gorm:"foreignKey:SemesterID;constraint:OnDelete:CASCADE" json:"semester,omitempty"`
	Branch     *Branch   `gorm:"foreignKey:BranchID;constraint:OnDelete:CASCADE" json:"branch,omitempty"`
}

// LabTopic represents topics within lab courses
type LabTopic struct {
	TopicID     uint      `gorm:"primaryKey;autoIncrement" json:"topic_id"`
	TopicName   string    `gorm:"size:200;not null" json:"topic_name"`
	Description string    `gorm:"type:text" json:"description"`
	CourseID    uint      `gorm:"not null" json:"course_id"`
	OrderIndex  int       `gorm:"default:0" json:"order_index"`
	CreatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	Course      *Course   `gorm:"foreignKey:CourseID;constraint:OnDelete:CASCADE" json:"course,omitempty"`
}

// TheoryModule represents week-wise modules for theory courses
type TheoryModule struct {
	ModuleID    uint      `gorm:"primaryKey;autoIncrement" json:"module_id"`
	CourseID    uint      `gorm:"not null" json:"course_id"`
	WeekNumber  int       `gorm:"not null" json:"week_number"`
	Title       string    `gorm:"size:200;not null" json:"title"`
	Description string    `gorm:"type:text" json:"description"`
	Content     string    `gorm:"type:text" json:"content"`
	OrderIndex  int       `gorm:"default:0" json:"order_index"`
	CreatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	Course      *Course   `gorm:"foreignKey:CourseID;constraint:OnDelete:CASCADE" json:"course,omitempty"`
}

// TopicProblem maps problems to lab topics (many-to-many)
type TopicProblem struct {
	TopicID     uint      `gorm:"primaryKey" json:"topic_id"`
	ProblemID   uint      `gorm:"primaryKey" json:"problem_id"`
	OrderIndex  int       `gorm:"default:0" json:"order_index"`
	IsMandatory bool      `gorm:"default:true" json:"is_mandatory"`
	Topic       *LabTopic `gorm:"foreignKey:TopicID;constraint:OnDelete:CASCADE" json:"topic,omitempty"`
	Problem     *Problem  `gorm:"foreignKey:ProblemID;constraint:OnDelete:CASCADE" json:"problem,omitempty"`
}
