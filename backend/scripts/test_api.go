package main

import (
	"coding-platform/config"
	"coding-platform/database"
	"coding-platform/middleware"
	"coding-platform/models"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
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
		log.Fatal(err)
	}

	claims := middleware.Claims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString([]byte(config.AppConfig.JWTSecret))

	client := &http.Client{}
	req, _ := http.NewRequest("GET", "http://localhost:8080/api/dashboard", nil)
	req.Header.Set("Authorization", "Bearer "+tokenString)

	resp, err := client.Do(req)
	if err != nil {
		log.Fatalf("Request failed: %v", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("STATUS: %d\n", resp.StatusCode)
	fmt.Printf("BODY: %s\n", string(body))
}
