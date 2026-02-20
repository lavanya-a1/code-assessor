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
	database.DB.Find(&courses)

	fmt.Println("Courses:")
	for _, c := range courses {
		fmt.Printf("- %s (ID: %d, BranchID: %d)\n", c.CourseName, c.ID, c.BranchID)
	}
}
