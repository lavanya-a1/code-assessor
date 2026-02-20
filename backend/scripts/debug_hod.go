package main

import (
	"coding-platform/config"
	"coding-platform/database"
	"coding-platform/models"
	"encoding/json"
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
	if err := database.DB.Where("username = ?", "hod_cse").First(&user).Error; err != nil {
		log.Fatalf("HOD user not found: %v", err)
	}

	userJSON, _ := json.MarshalIndent(user, "", "  ")
	fmt.Printf("User Details:\n%s\n", string(userJSON))

	if user.BranchID != nil {
		var branch models.Branch
		database.DB.First(&branch, *user.BranchID)
		fmt.Printf("Assigned Branch: %s (ID: %d)\n", branch.BranchName, branch.BranchID)
	} else {
		fmt.Println("BranchID is NIL")
	}
}
