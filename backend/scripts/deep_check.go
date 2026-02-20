package main

import (
	"coding-platform/config"
	"coding-platform/database"
	"coding-platform/models"
	"fmt"
	"log"
)

func main() {
	if err := config.LoadConfig(); err != nil {
		log.Fatal(err)
	}
	if err := database.Connect(); err != nil {
		log.Fatal(err)
	}

	branchID := uint(6)

	fmt.Printf("--- Checking Branch %d ---\n", branchID)

	var courses []models.Course
	database.DB.Where("branch_id = ?", branchID).Find(&courses)
	fmt.Printf("Courses (%d):\n", len(courses))
	for _, c := range courses {
		fmt.Printf("  ID: %d, Code: %s, Name: %s\n", c.ID, c.CourseCode, c.CourseName)
	}

	var sections []models.Section
	database.DB.Where("branch_id = ?", branchID).Find(&sections)
	fmt.Printf("Sections (%d):\n", len(sections))
	for _, s := range sections {
		fmt.Printf("  ID: %d, Name: %s\n", s.SectionID, s.SectionName)
	}

	var faculty []models.User
	database.DB.Where("role = ? AND branch_id = ?", "faculty", branchID).Find(&faculty)
	fmt.Printf("Faculty (%d):\n", len(faculty))
	for _, f := range faculty {
		fmt.Printf("  ID: %d, Username: %s\n", f.ID, f.Username)
	}
}
