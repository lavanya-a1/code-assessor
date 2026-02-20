package main

import (
	"coding-platform/config"
	"coding-platform/database"
	"coding-platform/models"
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

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("hod123"), bcrypt.DefaultCost)

	// Find the branch created in seed_data (ShortName: SE)
	var branch models.Branch
	if err := database.DB.Where("short_name = ?", "SE").First(&branch).Error; err != nil {
		log.Println("Branch SE not found, creating it first...")
		
		// Setup dependency chain for the branch
		college := models.College{CollegeName: "Engineering Institute", ShortName: "EIT"}
		database.DB.FirstOrCreate(&college, models.College{ShortName: "EIT"})
		
		program := models.Program{ProgramCode: "CS", ProgramName: "Computer Science"}
		database.DB.FirstOrCreate(&program, models.Program{ProgramCode: "CS"})
		
		branch = models.Branch{
			BranchName: "Software Engineering",
			ShortName:  "SE",
			CollegeID:  college.CollegeID,
			ProgramID:  program.ProgramID,
		}
		database.DB.Create(&branch)
	}

	hod := models.User{
		Username: "hod_cse",
		Email:    "hod_cse@eit.edu",
		Password: string(hashedPassword),
		Role:     "hod",
		BranchID: &branch.BranchID,
	}

	result := database.DB.Where("username = ?", "hod_cse").FirstOrCreate(&hod)
	if result.Error != nil {
		log.Fatal("Failed to create HOD:", result.Error)
	}

	log.Printf("HOD user created successfully!\nUsername: hod_cse\nPassword: hod123\nBranch: %s", branch.BranchName)
}
