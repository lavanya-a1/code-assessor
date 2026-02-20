package main

import (
	"coding-platform/config"
	"coding-platform/database"
	"coding-platform/handlers"
	"coding-platform/models"
	"fmt"
	"log"
	"net/http/httptest"


	"github.com/gin-gonic/gin"
)

func main() {
	if err := config.LoadConfig(); err != nil {
		log.Fatal(err)
	}
	if err := database.Connect(); err != nil {
		log.Fatal(err)
	}

	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(httptest.NewRecorder())

	var user models.User
	database.DB.Where("username = ?", "faculty_it").First(&user)
	fmt.Printf("Testing for User: %s (ID: %d)\n", user.Username, user.ID)

	// Set user_id in context manually as GetDashboard expects it
	c.Set("user_id", user.ID)

	// We can't call GetDashboard directly easily because it reads role from DB
	// So let's call the actual handler directly if we can, or just call GetDashboard
	
	handlers.GetDashboard(c)

	fmt.Println("Response Status:", c.Writer.Status())
	// If it didn't panic and returned 200, then the backend is fine.
}
