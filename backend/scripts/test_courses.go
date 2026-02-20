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

	var courses []models.Course
	if err := database.DB.Find(&courses).Error; err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Found %d courses\n", len(courses))
	for _, c := range courses {
		fmt.Printf("- %s: %s (Type: %s)\n", c.CourseCode, c.CourseName, c.CourseType)
	}
}
