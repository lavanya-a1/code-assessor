package main

import (
	"coding-platform/config"
	"coding-platform/database"
	"coding-platform/models"
	"log"
)

func main() {
	if err := config.LoadConfig(); err != nil {
		log.Fatal(err)
	}
	if err := database.Connect(); err != nil {
		log.Fatal(err)
	}

	// Target Branch ID 6 (Software Engineering)
	branchID := uint(6)

	// Verify branch exists
	var branch models.Branch
	if err := database.DB.First(&branch, branchID).Error; err != nil {
		log.Fatalf("Branch %d not found", branchID)
	}

	// Create Courses
	courses := []models.Course{
		{CourseCode: "CS301", CourseName: "Operating Systems", BranchID: branchID, SemesterID: 1}, // SemesterID=1 is just a placeholder
		{CourseCode: "CS302", CourseName: "Database Management", BranchID: branchID, SemesterID: 1},
		{CourseCode: "CS303", CourseName: "Computer Networks", BranchID: branchID, SemesterID: 1},
	}

	for i := range courses {
		database.DB.FirstOrCreate(&courses[i], models.Course{CourseCode: courses[i].CourseCode})
	}

	// Create Faculty for this branch
	faculty := []models.User{
		{Username: "arnold_dev", Email: "arnold@eit.edu", Role: "faculty", BranchID: &branchID},
		{Username: "sarah_os", Email: "sarah@eit.edu", Role: "faculty", BranchID: &branchID},
	}

	for i := range faculty {
		faculty[i].HashPassword("password123")
		database.DB.FirstOrCreate(&faculty[i], models.User{Username: faculty[i].Username})
	}

	// Create a Section for this branch
	section := models.Section{
		SectionName: "SE-A",
		BranchID:    branchID,
		SemesterID:  1,
		AcademicYearID: 1,
	}
	database.DB.FirstOrCreate(&section, models.Section{SectionName: "SE-A", BranchID: branchID})

	log.Println("HOD Branch data seeded successfully!")
}
