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

	var user models.User
	database.DB.Where("username = ?", "faculty_it").First(&user)
	fmt.Printf("User: %s (ID: %d)\n", user.Username, user.ID)

	var assignments []models.FacultyCourseAssignment
	database.DB.Preload("Course").Preload("Section").Where("faculty_id = ?", user.ID).Find(&assignments)
	
	fmt.Printf("Number of assignments: %d\n", len(assignments))
	for _, a := range assignments {
		fmt.Printf("Assignment ID: %d, Course: %v, Section: %v\n", a.ID, a.Course, a.Section)
	}
}
