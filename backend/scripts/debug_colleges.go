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

	var colleges []models.College
	database.DB.Find(&colleges)

	res := "ID | Name | ShortName\n"
	res += "------------------------\n"
	for _, c := range colleges {
		res += fmt.Sprintf("%d | %s | %s\n", c.CollegeID, c.CollegeName, c.ShortName)
	}
	os.WriteFile("debug_colleges.txt", []byte(res), 0644)
}
