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
	database.DB.Where("branch_id = ?", 6).Find(&courses)
	fmt.Printf("Courses in Branch 6: %d\n", len(courses))
	for _, c := range courses {
		fmt.Printf("- %s (%s)\n", c.CourseName, c.CourseCode)
	}
}
