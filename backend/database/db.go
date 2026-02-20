package database

import (
	"coding-platform/config"
	"coding-platform/models"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect() error {
	var err error
	
	DB, err = gorm.Open(postgres.Open(config.AppConfig.GetDSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	
	if err != nil {
		return err
	}

	log.Println("Database connected successfully")
	return nil
}

func Migrate() error {
	// Migrate tables in dependency order to avoid FK issues
	
	// 1. Independent tables first (no foreign keys)
	if err := DB.AutoMigrate(
		&models.Role{},
		&models.Permission{},
		&models.College{},
		&models.Program{},
		&models.AcademicYear{},
	); err != nil {
		return err
	}

	// 2. Tables with simple dependencies
	if err := DB.AutoMigrate(
		&models.RolePermission{},
		&models.User{},
		&models.Branch{},
		&models.Semester{},
	); err != nil {
		return err
	}

	// 3. Section depends on Semester, Branch, AcademicYear
	if err := DB.AutoMigrate(
		&models.Section{},
	); err != nil {
		return err
	}

	// 4. Enrollment tables
	if err := DB.AutoMigrate(
		&models.StudentEnrollment{},
	); err != nil {
		return err
	}

	// 5. Course tables
	if err := DB.AutoMigrate(
		&models.Course{},
		&models.FacultyCourseAssignment{},
		&models.LabTopic{},
		&models.TheoryModule{},
	); err != nil {
		return err
	}

	// 6. Problem tables
	if err := DB.AutoMigrate(
		&models.Problem{},
		&models.TestCase{},
		&models.TopicProblem{},
	); err != nil {
		return err
	}

	// 7. Lab Session tables
	if err := DB.AutoMigrate(
		&models.LabSession{},
		&models.LabSessionProblem{},
	); err != nil {
		return err
	}

	// 8. Contest tables
	if err := DB.AutoMigrate(
		&models.Contest{},
		&models.ContestProblem{},
		&models.ContestParticipant{},
	); err != nil {
		return err
	}

	// 9. Submission tables
	if err := DB.AutoMigrate(
		&models.Submission{},
		&models.UserProblemCompletion{},
	); err != nil {
		return err
	}

	// 10. Plagiarism tables
	if err := DB.AutoMigrate(
		&models.PlagiarismResult{},
		&models.PlagiarismMatch{},
	); err != nil {
		return err
	}

	// 11. Dashboard tracking tables
	if err := DB.AutoMigrate(
		&models.UserStreak{},
		&models.UserActivity{},
		&models.FacultyDeadline{},
		&models.FacultyInsight{},
	); err != nil {
		return err
	}


	log.Println("Database migration completed successfully!")
	return Seed()
}

func Seed() error {
	var count int64
	// Create default roles if not exists
	roles := []string{"student", "faculty", "hod", "principal", "college_admin", "super_admin"}
	for _, r := range roles {
		var role models.Role
		if err := DB.Where("role_name = ?", r).First(&role).Error; err != nil {
			DB.Create(&models.Role{RoleName: r})
		}
	}

	// Create super admin user if not exists
	DB.Model(&models.User{}).Where("role = ?", "super_admin").Count(&count)
	if count == 0 {
		superAdmin := models.User{
			Username: "superadmin",
			Email:    "superadmin@example.com",
			Role:     "super_admin",
			IsActive: true,
		}
		if err := superAdmin.HashPassword("superadmin123"); err != nil {
			return err
		}
		if err := DB.Create(&superAdmin).Error; err != nil {
			return err
		}
		log.Println("Super admin user created successfully: superadmin / superadmin123")
	}
	return nil
}

