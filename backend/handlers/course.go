package handlers

import (
	"coding-platform/database"
	"coding-platform/models"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func GetCourses(c *gin.Context) {
	log.Printf("[DEBUG] GetCourses called at %v", time.Now().Format(time.RFC850))
	var courses []models.Course
	if err := database.DB.Find(&courses).Error; err != nil {
		log.Printf("[ERROR] GetCourses error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch courses"})
		return
	}
	log.Printf("[DEBUG] GetCourses returned %d results", len(courses))
	c.JSON(http.StatusOK, courses)
}

func CreateCourse(c *gin.Context) {
	var course models.Course
	if err := c.ShouldBindJSON(&course); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	course.CreatedBy = userID.(uint)

	if err := database.DB.Create(&course).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create course"})
		return
	}

	c.JSON(http.StatusCreated, course)
}
