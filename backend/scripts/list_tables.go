package main

import (
	"coding-platform/config"
	"coding-platform/database"
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

	rows, err := database.DB.Raw("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name").Rows()
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	fmt.Println("TABLE_LIST_START")
	for rows.Next() {
		var name string
		rows.Scan(&name)
		fmt.Println(name)
	}
	fmt.Println("TABLE_LIST_END")
}
