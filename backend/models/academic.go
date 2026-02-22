package models

import "time"

// Role defines user roles in the system
type Role struct {
	RoleID   uint   `gorm:"primaryKey;autoIncrement" json:"role_id"`
	RoleName string `gorm:"size:50;unique;not null" json:"role_name"`
	// student, faculty, hod, principal, college_admin, super_admin
}

// Permission defines system permissions
type Permission struct {
	PermissionID   uint   `gorm:"primaryKey;autoIncrement" json:"permission_id"`
	PermissionName string `gorm:"size:100;unique;not null" json:"permission_name"`
}

// RolePermission maps roles to permissions (many-to-many)
type RolePermission struct {
	RoleID       uint       `gorm:"primaryKey" json:"role_id"`
	PermissionID uint       `gorm:"primaryKey" json:"permission_id"`
	Role         Role       `gorm:"foreignKey:RoleID;constraint:OnDelete:CASCADE" json:"-"`
	Permission   Permission `gorm:"foreignKey:PermissionID;constraint:OnDelete:CASCADE" json:"-"`
}

// College represents an educational institution
type College struct {
	CollegeID   uint      `gorm:"primaryKey;autoIncrement" json:"college_id"`
	CollegeName string    `gorm:"size:200;not null" json:"college_name"`
	ShortName   string    `gorm:"size:20;not null" json:"short_name"`
	Address     string    `gorm:"type:text" json:"address"`
	IsActive    bool      `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
}

// Program represents academic programs like BTech, MTech, MBA
type Program struct {
	ProgramID     uint   `gorm:"primaryKey;autoIncrement" json:"program_id"`
	ProgramCode   string `gorm:"size:10;not null" json:"program_code"`   // BT, MT, MBA
	ProgramName   string `gorm:"size:50;not null" json:"program_name"`   // BTech, MTech, MBA
	DurationYears int    `gorm:"default:4" json:"duration_years"`
}

// Branch represents departments within a program
type Branch struct {
	BranchID   uint      `gorm:"primaryKey;autoIncrement" json:"branch_id"`
	BranchName string    `gorm:"size:100;not null" json:"branch_name"`
	ShortName  string    `gorm:"size:20;not null" json:"short_name"`
	CollegeID  uint      `gorm:"not null" json:"college_id"`
	ProgramID  uint      `gorm:"not null" json:"program_id"`
	HODID      *uint     `json:"hod_id,omitempty"`
	College    *College  `gorm:"foreignKey:CollegeID;references:CollegeID;constraint:OnDelete:CASCADE" json:"college,omitempty"`
	Program    *Program  `gorm:"foreignKey:ProgramID;references:ProgramID;constraint:OnDelete:CASCADE" json:"program,omitempty"`
	HOD        *User     `gorm:"foreignKey:HODID" json:"hod,omitempty"`
}

// AcademicYear represents an academic year
type AcademicYear struct {
	AcademicYearID uint `gorm:"primaryKey;autoIncrement" json:"academic_year_id"`
	YearStart      int  `gorm:"not null" json:"year_start"` // 2022
	YearEnd        int  `gorm:"not null" json:"year_end"`   // 2023
	IsCurrent      bool `gorm:"default:false" json:"is_current"`
}

// Semester represents semesters within a program
type Semester struct {
	SemesterID     uint     `gorm:"primaryKey;autoIncrement" json:"semester_id"`
	ProgramID      uint     `gorm:"not null" json:"program_id"`
	SemesterNumber int      `gorm:"not null" json:"semester_number"` // 1..8
	Program        *Program `gorm:"foreignKey:ProgramID;constraint:OnDelete:CASCADE" json:"program,omitempty"`
}

// Section represents class sections
type Section struct {
	SectionID      uint          `gorm:"primaryKey;autoIncrement" json:"section_id"`
	SectionName    string        `gorm:"size:10;not null" json:"section_name"` // A, B, C
	SemesterID     uint          `gorm:"not null" json:"semester_id"`
	BranchID       uint          `gorm:"not null" json:"branch_id"`
	AcademicYearID uint          `gorm:"not null" json:"academic_year_id"`
	Semester       *Semester     `gorm:"foreignKey:SemesterID;constraint:OnDelete:CASCADE" json:"semester,omitempty"`
	Branch         *Branch       `gorm:"foreignKey:BranchID;constraint:OnDelete:CASCADE" json:"branch,omitempty"`
	AcademicYear   *AcademicYear `gorm:"foreignKey:AcademicYearID;constraint:OnDelete:CASCADE" json:"academic_year,omitempty"`
}
