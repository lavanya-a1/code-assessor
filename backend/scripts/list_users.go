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

	var users []models.User
	if err := database.DB.Find(&users).Error; err != nil {
		log.Fatal(err)
	}

	fmt.Println("Existing Users:")
	for _, u := range users {
		fmt.Printf("- Username: %s, Role: %s\n", u.Username, u.Role)
	}
}
