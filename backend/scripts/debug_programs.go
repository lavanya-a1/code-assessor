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

	var programs []models.Program
	database.DB.Find(&programs)

	res := "ID | Name\n"
	res += "-----------\n"
	for _, p := range programs {
		res += fmt.Sprintf("%d | %s\n", p.ProgramID, p.ProgramName)
	}
	os.WriteFile("debug_programs.txt", []byte(res), 0644)
}
