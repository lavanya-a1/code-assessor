package handlers

import (
	"coding-platform/database"
	"coding-platform/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// --- College Management ---

func GetAllColleges(c *gin.Context) {
	var colleges []models.College
	if err := database.DB.Find(&colleges).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch colleges"})
		return
	}
	c.JSON(http.StatusOK, colleges)
}

func CreateCollege(c *gin.Context) {
	var college models.College
	if err := c.ShouldBindJSON(&college); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Create(&college).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create college"})
		return
	}
	c.JSON(http.StatusCreated, college)
}

func UpdateCollege(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var college models.College
	if err := database.DB.First(&college, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "College not found"})
		return
	}

	if err := c.ShouldBindJSON(&college); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	database.DB.Save(&college)
	c.JSON(http.StatusOK, college)
}

// --- Program Management ---

func GetAllPrograms(c *gin.Context) {
	var programs []models.Program
	if err := database.DB.Find(&programs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch programs"})
		return
	}
	c.JSON(http.StatusOK, programs)
}

func CreateProgram(c *gin.Context) {
	var program models.Program
	if err := c.ShouldBindJSON(&program); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Create(&program).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create program"})
		return
	}
	c.JSON(http.StatusCreated, program)
}

// --- Branch Management ---

func SuperAdminGetAllBranches(c *gin.Context) {
	var branches []models.Branch
	// Explicitly preload with joins to ensure relations are found
	if err := database.DB.Preload("College").Preload("Program").Find(&branches).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch branches"})
		return
	}
	c.JSON(http.StatusOK, branches)
}

func CreateBranch(c *gin.Context) {
	var branch models.Branch
	if err := c.ShouldBindJSON(&branch); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Create(&branch).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create branch"})
		return
	}
	c.JSON(http.StatusCreated, branch)
}

// --- Super Admin Stats ---

func GetSuperAdminStats(c *gin.Context) {
	var collegeCount, userCount, problemCount, submissionCount, branchCount int64
	database.DB.Model(&models.College{}).Count(&collegeCount)
	database.DB.Model(&models.User{}).Count(&userCount)
	database.DB.Model(&models.Problem{}).Count(&problemCount)
	database.DB.Model(&models.Submission{}).Count(&submissionCount)
	database.DB.Model(&models.Branch{}).Count(&branchCount)

	c.JSON(http.StatusOK, gin.H{
		"total_colleges":    collegeCount,
		"total_users":       userCount,
		"total_problems":    problemCount,
		"total_submissions": submissionCount,
		"total_branches":    branchCount,
	})
}

// --- User Management (Global) ---

func SuperAdminGetAllUsers(c *gin.Context) {
	var users []models.User
	if err := database.DB.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	c.JSON(http.StatusOK, users)
}

func SuperAdminUpdateUser(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var req struct {
		Role      string `json:"role"`
		IsActive  *bool  `json:"is_active"`
		CollegeID *uint  `json:"college_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Role != "" {
		user.Role = req.Role
	}
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}
	if req.CollegeID != nil {
		user.CollegeID = req.CollegeID
	}

	database.DB.Save(&user)
	c.JSON(http.StatusOK, user)
}

