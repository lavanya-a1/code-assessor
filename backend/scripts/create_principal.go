package main

import (
	"coding-platform/config"
	"coding-platform/database"
	"coding-platform/models"
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	if err := config.LoadConfig(); err != nil {
		log.Fatal(err)
	}
	if err := database.Connect(); err != nil {
		log.Fatal(err)
	}

	username := "principal"
	password := "principal123"
	email := "principal@eit.edu"

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	user := models.User{
		Username: username,
		Email:    email,
		Password: string(hashedPassword),
		Role:     "principal",
		IsActive: true,
	}

	if err := database.DB.Where("username = ?", username).FirstOrCreate(&user).Error; err != nil {
		log.Fatalf("Failed to create principal: %v", err)
	}

	fmt.Printf("Principal user created/found: %s, role: %s, password: %s\n", user.Username, user.Role, password)
}
