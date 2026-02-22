package main

import (
	"coding-platform/config"
	"coding-platform/database"
	"coding-platform/models"
	"encoding/json"
	"fmt"
)

func main() {
	config.LoadConfig()
	database.Connect()

	var branches []models.Branch
	database.DB.Preload("College").Preload("Program").Find(&branches)

	for _, b := range branches {
		out, _ := json.MarshalIndent(b, "", "  ")
		fmt.Println(string(out))
	}
}
