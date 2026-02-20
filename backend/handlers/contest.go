package handlers

import (
	"coding-platform/database"
	"coding-platform/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func GetContests(c *gin.Context) {
	var contests []models.Contest
	if err := database.DB.Find(&contests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch contests"})
		return
	}

	now := time.Now()
	var current []models.Contest
	var upcoming []models.Contest
	var past []models.Contest

	for _, contest := range contests {
		if now.Before(contest.StartTime) {
			upcoming = append(upcoming, contest)
		} else if now.After(contest.EndTime) {
			past = append(past, contest)
		} else {
			current = append(current, contest)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"current":  current,
		"upcoming": upcoming,
		"past":     past,
	})
}

func CreateContest(c *gin.Context) {
	var contest models.Contest
	if err := c.ShouldBindJSON(&contest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	contest.CreatedBy = userID.(uint)

	if err := database.DB.Create(&contest).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create contest"})
		return
	}

	c.JSON(http.StatusCreated, contest)
}
