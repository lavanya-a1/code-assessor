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

	// Update all existing courses to use 'lab' or 'theory'
	
	// First, set all programming/lab-related courses to 'lab'
	labKeywords := []string{
		"%Programming%", "%Data Structures%", "%Web%", "%Database%",
	}
	
	for _, keyword := range labKeywords {
		database.DB.Model(&models.Course{}).
			Where("course_name LIKE ?", keyword).
			Update("course_type", "lab")
	}

	// Set theory courses
	theoryKeywords := []string{
		"%Algorithms%", "%Networks%", "%Electronics%",
	}
	
	for _, keyword := range theoryKeywords {
		database.DB.Model(&models.Course{}).
			Where("course_name LIKE ?", keyword).
			Update("course_type", "theory")
	}

	// Update by course code patterns
	database.DB.Model(&models.Course{}).
		Where("course_code IN (?)", []string{"CS101", "CS201", "IT201", "IT301", "CS301", "CS302"}).
		Update("course_type", "lab")

	database.DB.Model(&models.Course{}).
		Where("course_code IN (?)", []string{"CS202", "ECE201", "CS303"}).
		Update("course_type", "theory")

	// Ensure any remaining "Core", "PROGRAMMING", etc. default to lab
	database.DB.Model(&models.Course{}).
		Where("course_type NOT IN (?)", []string{"lab", "theory"}).
		Update("course_type", "lab")

	// List all courses after update
	var courses []models.Course
	database.DB.Find(&courses)

	log.Println("\n=== Updated Courses ===")
	labCount := 0
	theoryCount := 0
	for _, c := range courses {
		log.Printf("ID: %d | Code: %s | Name: %s | Type: %s\n", c.ID, c.CourseCode, c.CourseName, c.CourseType)
		if c.CourseType == "lab" {
			labCount++
		} else if c.CourseType == "theory" {
			theoryCount++
		}
	}

	log.Printf("\nSummary: %d Lab courses, %d Theory courses\n", labCount, theoryCount)
	log.Println("Course types updated successfully!")
}
