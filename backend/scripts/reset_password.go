package main

import (
	"coding-platform/config"
	"fmt"
	"log"
	"os"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	if len(os.Args) < 3 {
		fmt.Println("Usage: go run scripts/reset_password.go <username> <password>")
		fmt.Println("Example: go run scripts/reset_password.go student2 password123")
		return
	}

	username := os.Args[1]
	plainPassword := os.Args[2]

	// Initialize config
	config.LoadConfig()

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(plainPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	// Connect to database
	db, err := gorm.Open(postgres.Open(config.AppConfig.GetDSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Update user password
	result := db.Table("users").
		Where("username = ?", username).
		Update("password", string(hashedPassword))

	if result.Error != nil {
		log.Fatalf("Failed to update password: %v", result.Error)
	}

	if result.RowsAffected == 0 {
		fmt.Printf("User '%s' not found\n", username)
		return
	}

	fmt.Printf("Password for user '%s' has been reset to '%s' successfully\n", username, plainPassword)
}
