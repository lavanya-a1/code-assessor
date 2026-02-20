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

	var branches []models.Branch
	database.DB.Find(&branches)

	fmt.Println("Branches:")
	for _, b := range branches {
		var count int64
		database.DB.Model(&models.Course{}).Where("branch_id = ?", b.BranchID).Count(&count)
		fmt.Printf("- %s (ID: %d, Courses: %d)\n", b.BranchName, b.BranchID, count)
	}
}
