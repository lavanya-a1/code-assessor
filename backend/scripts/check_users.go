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
	err := database.DB.Where("username = ?", "faculty_it").First(&user).Error
	if err != nil {
		fmt.Println("User faculty_it not found:", err)
	} else {
		fmt.Printf("ID: %d, Username: %s, Role: %s\n", user.ID, user.Username, user.Role)
	}
}

