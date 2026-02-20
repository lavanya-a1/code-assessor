package main

import (
	"coding-platform/config"
	"coding-platform/database"
	"coding-platform/models"
	"fmt"
)

func main() {
	config.LoadConfig()
	database.Connect()
	var courses []models.Course
	database.DB.Where("branch_id = ?", 6).Find(&courses)
	fmt.Printf("COURSES_COUNT: %d\n", len(courses))
	for _, c := range courses {
		fmt.Printf("COURSE: %d | %s | %s\n", c.ID, c.CourseCode, c.CourseName)
	}
}
