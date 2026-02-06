package main

import (
	"fmt"
	"os"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	password := "password123"
	if len(os.Args) > 1 {
		password = os.Args[1]
	}
	
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	
	fmt.Println("Password:", password)
	fmt.Println("Hash:", string(hash))
	fmt.Println("\nSQL to update user:")
	fmt.Printf("UPDATE users SET password = '%s' WHERE username = 'student2';\n", string(hash))
}
