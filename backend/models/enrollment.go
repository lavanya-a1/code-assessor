package models

import "time"

// StudentEnrollment maps students to sections per academic year
type StudentEnrollment struct {
	ID             uint          `gorm:"primaryKey" json:"id"`
	StudentID      uint          `gorm:"not null" json:"student_id"`
	SectionID      uint          `gorm:"not null" json:"section_id"`
	RollNumber     string        `gorm:"size:20" json:"roll_number"`
	AcademicYearID uint          `gorm:"not null" json:"academic_year_id"`
	EnrolledAt     time.Time     `gorm:"default:CURRENT_TIMESTAMP" json:"enrolled_at"`
	Student        *User         `gorm:"foreignKey:StudentID;constraint:OnDelete:CASCADE" json:"student,omitempty"`
	Section        *Section      `gorm:"foreignKey:SectionID;constraint:OnDelete:CASCADE" json:"section,omitempty"`
	AcademicYear   *AcademicYear `gorm:"foreignKey:AcademicYearID" json:"academic_year,omitempty"`
}

// FacultyCourseAssignment maps faculty to courses/sections
type FacultyCourseAssignment struct {
	ID             uint          `gorm:"primaryKey" json:"id"`
	FacultyID      uint          `gorm:"not null" json:"faculty_id"`
	CourseID       uint          `gorm:"not null" json:"course_id"`
	SectionID      uint          `gorm:"not null" json:"section_id"`
	AcademicYearID uint          `gorm:"not null" json:"academic_year_id"`
	Schedule       string        `gorm:"size:100" json:"schedule"` // e.g. "MWF 10:00 AM"
	Status         string        `gorm:"size:20;default:ACTIVE" json:"status"`   // e.g. "ACTIVE"
	ImageURL       string        `gorm:"size:255" json:"image_url"`
	AssignedAt     time.Time     `gorm:"default:CURRENT_TIMESTAMP" json:"assigned_at"`
	Faculty        *User         `gorm:"foreignKey:FacultyID;constraint:OnDelete:CASCADE" json:"faculty,omitempty"`
	Course         *Course       `gorm:"foreignKey:CourseID;constraint:OnDelete:CASCADE" json:"course,omitempty"`
	Section        *Section      `gorm:"foreignKey:SectionID;constraint:OnDelete:CASCADE" json:"section,omitempty"`
	AcademicYear   *AcademicYear `gorm:"foreignKey:AcademicYearID" json:"academic_year,omitempty"`
}

