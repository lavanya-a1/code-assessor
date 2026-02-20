package main

import (
	"coding-platform/config"
	"coding-platform/database"
	"coding-platform/models"
	"log"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	if err := config.LoadConfig(); err != nil {
		log.Fatal(err)
	}
	if err := database.Connect(); err != nil {
		log.Fatal(err)
	}

	// Create a faculty user
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	faculty := models.User{
		Username: "faculty1",
		Email:    "faculty1@example.com",
		Password: string(hashedPassword),
		Role:     "faculty",
	}
	database.DB.Create(&faculty)

	// Create Course
	course := models.Course{
		CourseCode: "CS101",
		CourseName: "Introduction to Programming",
		CourseType: "PROGRAMMING",
	}
	database.DB.Create(&course)

	// Create Academic Year
	ay := models.AcademicYear{
		YearStart: 2024,
		YearEnd:   2025,
		IsCurrent: true,
	}
	database.DB.Create(&ay)

	// Create Section
	section := models.Section{
		SectionName:    "A",
		AcademicYearID: ay.AcademicYearID,
	}
	database.DB.Create(&section)

	// Create Assignment
	assignment := models.FacultyCourseAssignment{
		FacultyID:      faculty.ID,
		CourseID:       course.ID,
		SectionID:      section.SectionID,
		AcademicYearID: ay.AcademicYearID,
	}
	database.DB.Create(&assignment)

	// Create some students and enroll them
	for i := 1; i <= 5; i++ {
		student := models.User{
			Username: string(rune('a' + i)),
			Email:    string(rune('a'+i)) + "@student.com",
			Password: string(hashedPassword),
			Role:     "student",
		}
		database.DB.Create(&student)
		enrollment := models.StudentEnrollment{
			StudentID:      student.ID,
			SectionID:      section.SectionID,
			AcademicYearID: ay.AcademicYearID,
		}
		database.DB.Create(&enrollment)
	}

	log.Println("Seeding completed!")
}
