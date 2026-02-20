package handlers

import (
	"coding-platform/database"
	"coding-platform/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetLabSessions(c *gin.Context) {
	var sessions []models.LabSession
	if err := database.DB.Preload("Course").Preload("Section").Find(&sessions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch lab sessions"})
		return
	}
	c.JSON(http.StatusOK, sessions)
}

func CreateLabSession(c *gin.Context) {
	var session models.LabSession
	if err := c.ShouldBindJSON(&session); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	session.CreatedBy = userID.(uint)

	if err := database.DB.Create(&session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create lab session"})
		return
	}

	c.JSON(http.StatusCreated, session)
}
