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

	var count int64
	database.DB.Model(&models.Course{}).Count(&count)
	fmt.Printf("Total Course Count: %d\n", count)

	var courses []models.Course
	database.DB.Find(&courses)
	for _, c := range courses {
		fmt.Printf("Course: ID=%d, Code=%s, Name=%s, Type=%s\n", c.ID, c.CourseCode, c.CourseName, c.CourseType)
	}
}
