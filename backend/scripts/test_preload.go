package main

import (
	"coding-platform/config"
	"coding-platform/database"
	"coding-platform/models"
	"encoding/json"
	"fmt"
	"os"
)

func main() {
	config.LoadConfig()
	database.Connect()

	var branches []models.Branch
	err := database.DB.Preload("College").Preload("Program").Find(&branches).Error
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	for i, b := range branches {
		fmt.Printf("Branch %d: %s\n", i, b.BranchName)
		if b.College != nil {
			fmt.Printf("  College: %s\n", b.College.CollegeName)
		} else {
			fmt.Printf("  College: NIL (ID: %d)\n", b.CollegeID)
		}
		if b.Program != nil {
			fmt.Printf("  Program: %s\n", b.Program.ProgramName)
		} else {
			fmt.Printf("  Program: NIL (ID: %d)\n", b.ProgramID)
		}
	}

	// Output as JSON to a file for deeper inspection
	data, _ := json.MarshalIndent(branches, "", "  ")
	os.WriteFile("debug_preload.json", data, 0644)
}
