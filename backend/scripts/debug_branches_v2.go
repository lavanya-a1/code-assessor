package main

import (
	"coding-platform/config"
	"coding-platform/database"
	"coding-platform/models"
	"fmt"
	"os"
)

func main() {
	config.LoadConfig()
	database.Connect()

	var branches []models.Branch
	database.DB.Find(&branches)

	res := "ID | Name | CollegeID | ProgramID\n"
	res += "-----------------------------------\n"
	for _, b := range branches {
		res += fmt.Sprintf("%d | %s | %d | %d\n", b.BranchID, b.BranchName, b.CollegeID, b.ProgramID)
	}
	os.WriteFile("debug_branches.txt", []byte(res), 0644)
}
