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
	database.DB.Find(&courses)
	fmt.Printf("TOTAL_COURSES: %d\n", len(courses))
	for _, c := range courses {
		fmt.Printf("COURSE: ID=%d, Code=%s, BranchID=%d\n", c.ID, c.CourseCode, c.BranchID)
	}
}
