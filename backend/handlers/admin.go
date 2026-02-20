package handlers

import (
	"coding-platform/database"
	"coding-platform/models"
	"encoding/csv"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ─── User Management ────────────────────────────────────────────────────────

// GetAdminUsers returns all users of a given role for the admin's college
func GetAdminUsers(c *gin.Context) {
	role := c.Query("role") // "faculty" | "student"

	query := database.DB.Model(&models.User{})
	if role != "" {
		query = query.Where("role = ?", role)
	} else {
		// Exclude super_admin / principal from bulk view
		query = query.Where("role IN (?)", []string{"faculty", "student", "hod"})
	}

	var users []models.User
	if err := query.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	c.JSON(http.StatusOK, users)
}

// ToggleUserActive activates / deactivates a user
func ToggleUserActive(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user.IsActive = !user.IsActive
	database.DB.Save(&user)
	c.JSON(http.StatusOK, gin.H{"message": "User status updated", "is_active": user.IsActive})
}

// CreateUser allows admin to create faculty or student accounts
func CreateAdminUser(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Email    string `json:"email"    binding:"required"`
		Password string `json:"password" binding:"required"`
		Role     string `json:"role"     binding:"required"` // faculty | student
		BranchID *uint  `json:"branch_id"`
		Phone    string `json:"phone"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := models.User{
		Username: req.Username,
		Email:    req.Email,
		Role:     req.Role,
		BranchID: req.BranchID,
		Phone:    req.Phone,
		IsActive: true,
	}
	if err := user.HashPassword(req.Password); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}
	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user: " + err.Error()})
		return
	}
	c.JSON(http.StatusCreated, user)
}

// ─── Session Management ──────────────────────────────────────────────────────

// Session is the unified model for both lab and theory sessions of a course
type SessionResponse struct {
	ID          uint   `json:"id"`
	CourseID    uint   `json:"course_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	SessionType string `json:"session_type"` // "lab" | "theory"
	WeekNumber  int    `json:"week_number"`
	OrderIndex  int    `json:"order_index"`
}

// GetCourseSessions returns all sessions (lab topics + theory modules) for a course
func GetCourseSessions(c *gin.Context) {
	courseID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	var course models.Course
	if err := database.DB.First(&course, courseID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}

	var sessions []SessionResponse

	if course.CourseType == "lab" {
		var topics []models.LabTopic
		database.DB.Where("course_id = ?", courseID).Order("order_index asc").Find(&topics)
		for _, t := range topics {
			sessions = append(sessions, SessionResponse{
				ID:          t.TopicID,
				CourseID:    t.CourseID,
				Title:       t.TopicName,
				Description: t.Description,
				SessionType: "lab",
				OrderIndex:  t.OrderIndex,
			})
		}
	} else {
		var modules []models.TheoryModule
		database.DB.Where("course_id = ?", courseID).Order("week_number asc").Find(&modules)
		for _, m := range modules {
			sessions = append(sessions, SessionResponse{
				ID:          m.ModuleID,
				CourseID:    m.CourseID,
				Title:       m.Title,
				Description: m.Description,
				SessionType: "theory",
				WeekNumber:  m.WeekNumber,
				OrderIndex:  m.OrderIndex,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{"course": course, "sessions": sessions})
}

// CreateSession creates a lab topic or theory module for a course
func CreateSession(c *gin.Context) {
	courseID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	var req struct {
		Title       string `json:"title"        binding:"required"`
		Description string `json:"description"`
		WeekNumber  int    `json:"week_number"`
		OrderIndex  int    `json:"order_index"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var course models.Course
	if err := database.DB.First(&course, courseID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}

	if course.CourseType == "lab" {
		topic := models.LabTopic{
			TopicName:   req.Title,
			Description: req.Description,
			CourseID:    uint(courseID),
			OrderIndex:  req.OrderIndex,
		}
		if err := database.DB.Create(&topic).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create lab session"})
			return
		}
		c.JSON(http.StatusCreated, SessionResponse{
			ID: topic.TopicID, CourseID: topic.CourseID,
			Title: topic.TopicName, Description: topic.Description,
			SessionType: "lab", OrderIndex: topic.OrderIndex,
		})
	} else {
		module := models.TheoryModule{
			CourseID:    uint(courseID),
			Title:       req.Title,
			Description: req.Description,
			WeekNumber:  req.WeekNumber,
			OrderIndex:  req.OrderIndex,
		}
		if err := database.DB.Create(&module).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create theory session"})
			return
		}
		c.JSON(http.StatusCreated, SessionResponse{
			ID: module.ModuleID, CourseID: module.CourseID,
			Title: module.Title, Description: module.Description,
			SessionType: "theory", WeekNumber: module.WeekNumber, OrderIndex: module.OrderIndex,
		})
	}
}

// DeleteSession deletes a session (lab topic or theory module)
func DeleteSession(c *gin.Context) {
	courseID, err1 := strconv.ParseUint(c.Param("id"), 10, 64)
	sessionID, err2 := strconv.ParseUint(c.Param("session_id"), 10, 64)
	if err1 != nil || err2 != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid IDs"})
		return
	}

	var course models.Course
	if err := database.DB.First(&course, courseID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}

	if course.CourseType == "lab" {
		database.DB.Delete(&models.LabTopic{}, sessionID)
	} else {
		database.DB.Delete(&models.TheoryModule{}, sessionID)
	}
	c.JSON(http.StatusOK, gin.H{"message": "Session deleted"})
}

// ─── Session Problem Management (Lab) ────────────────────────────────────────

type SessionProblemInfo struct {
	TopicID    uint   `json:"topic_id"`
	ProblemID  uint   `json:"problem_id"`
	Title      string `json:"title"`
	Difficulty string `json:"difficulty"`
	Tags       string `json:"tags"`
	OrderIndex int    `json:"order_index"`
}

// GetSessionProblems returns problems linked to a lab topic
func GetSessionProblems(c *gin.Context) {
	topicID, err := strconv.ParseUint(c.Param("session_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	var topicProblems []models.TopicProblem
	database.DB.Preload("Problem").Where("topic_id = ?", topicID).Order("order_index asc").Find(&topicProblems)

	var result []SessionProblemInfo
	for _, tp := range topicProblems {
		if tp.Problem != nil {
			result = append(result, SessionProblemInfo{
				TopicID:    tp.TopicID,
				ProblemID:  tp.ProblemID,
				Title:      tp.Problem.Title,
				Difficulty: tp.Problem.Difficulty,
				Tags:       tp.Problem.Tags,
				OrderIndex: tp.OrderIndex,
			})
		}
	}
	c.JSON(http.StatusOK, result)
}

// AddProblemToSession links an existing problem to a lab topic
func AddProblemToSession(c *gin.Context) {
	topicID, err := strconv.ParseUint(c.Param("session_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	var req struct {
		ProblemID  uint `json:"problem_id" binding:"required"`
		OrderIndex int  `json:"order_index"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tp := models.TopicProblem{
		TopicID:    uint(topicID),
		ProblemID:  req.ProblemID,
		OrderIndex: req.OrderIndex,
	}
	if err := database.DB.Create(&tp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add problem to session"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Problem added to session"})
}

// RemoveProblemFromSession removes a problem from a lab topic
func RemoveProblemFromSession(c *gin.Context) {
	topicID, err1 := strconv.ParseUint(c.Param("session_id"), 10, 64)
	problemID, err2 := strconv.ParseUint(c.Param("problem_id"), 10, 64)
	if err1 != nil || err2 != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid IDs"})
		return
	}
	database.DB.Where("topic_id = ? AND problem_id = ?", topicID, problemID).Delete(&models.TopicProblem{})
	c.JSON(http.StatusOK, gin.H{"message": "Problem removed from session"})
}

// ─── Session Lesson Management (Theory) ──────────────────────────────────────

type LessonInfo struct {
	ModuleID    uint   `json:"module_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Content     string `json:"content"`
	WeekNumber  int    `json:"week_number"`
	OrderIndex  int    `json:"order_index"`
}

// GetSessionLessons returns lessons (theory modules) for a course
func GetSessionLessons(c *gin.Context) {
	sessionID, err := strconv.ParseUint(c.Param("session_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	var module models.TheoryModule
	if err := database.DB.First(&module, sessionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	c.JSON(http.StatusOK, LessonInfo{
		ModuleID:    module.ModuleID,
		Title:       module.Title,
		Description: module.Description,
		Content:     module.Content,
		WeekNumber:  module.WeekNumber,
		OrderIndex:  module.OrderIndex,
	})
}

// UpdateSessionLesson updates the content of a theory module/lesson
func UpdateSessionLesson(c *gin.Context) {
	sessionID, err := strconv.ParseUint(c.Param("session_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Content     string `json:"content"`
		WeekNumber  int    `json:"week_number"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{}
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Content != "" {
		updates["content"] = req.Content
	}
	if req.WeekNumber > 0 {
		updates["week_number"] = req.WeekNumber
	}

	if err := database.DB.Model(&models.TheoryModule{}).Where("module_id = ?", sessionID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update lesson"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Lesson updated"})
}

// GetAllProblems returns all problems (for admin to browse and add to sessions)
func GetAllProblemsForAdmin(c *gin.Context) {
	var problems []models.Problem
	database.DB.Find(&problems)
	c.JSON(http.StatusOK, problems)
}

// GetAdminStats returns comprehensive admin stats
func GetAdminStats(c *gin.Context) {
	var courseCount, labCount, theoryCount, problemCount, studentCount, facultyCount int64
	database.DB.Model(&models.Course{}).Count(&courseCount)
	database.DB.Model(&models.Course{}).Where("course_type = ?", "lab").Count(&labCount)
	database.DB.Model(&models.Course{}).Where("course_type = ?", "theory").Count(&theoryCount)
	database.DB.Model(&models.Problem{}).Count(&problemCount)
	database.DB.Model(&models.User{}).Where("role = ?", "student").Count(&studentCount)
	database.DB.Model(&models.User{}).Where("role IN (?)", []string{"faculty", "hod"}).Count(&facultyCount)

	c.JSON(http.StatusOK, gin.H{
		"total_courses":   courseCount,
		"lab_courses":     labCount,
		"theory_courses":  theoryCount,
		"total_problems":  problemCount,
		"total_students":  studentCount,
		"total_faculty":   facultyCount,
	})
}

// DownloadUserTemplate returns a CSV template for bulk user upload
func DownloadUserTemplate(c *gin.Context) {
	role := c.Query("role")
	if role == "" {
		role = "user"
	}
	filename := fmt.Sprintf("%s_import_template.csv", role)

	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.Header("Content-Type", "text/csv")

	w := csv.NewWriter(c.Writer)
	// Header row: username, email, password, branch_id, phone
	w.Write([]string{"username", "email", "password", "branch_id", "phone"})
	w.Flush()
}

// BulkCreateUsers handles CSV upload for creating multiple users
func BulkCreateUsers(c *gin.Context) {
	role := c.Query("role") // "faculty" | "student"
	if role == "" {
		role = "student"
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	f, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file"})
		return
	}
	defer f.Close()

	reader := csv.NewReader(f)
	// Skip header row
	_, err = reader.Read()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Empty or invalid CSV file"})
		return
	}

	var usersCreated int
	var errors []string

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			errors = append(errors, "Error reading row: "+err.Error())
			continue
		}

		// Expected columns: username, email, password, branch_id, phone
		if len(record) < 3 {
			errors = append(errors, "Row too short (need at least username, email, password)")
			continue
		}

		username := record[0]
		email := record[1]
		password := record[2]
		branchIDStr := ""
		if len(record) > 3 {
			branchIDStr = record[3]
		}
		phone := ""
		if len(record) > 4 {
			phone = record[4]
		}

		if username == "" || email == "" || password == "" {
			errors = append(errors, "Missing required fields for row: "+username)
			continue
		}

		user := models.User{
			Username: username,
			Email:    email,
			Role:     role,
			Phone:    phone,
			IsActive: true,
		}

		if branchIDStr != "" {
			bid, err := strconv.ParseUint(branchIDStr, 10, 64)
			if err == nil {
				ubid := uint(bid)
				user.BranchID = &ubid
			}
		}

		if err := user.HashPassword(password); err != nil {
			errors = append(errors, "Failed to hash password for: "+username)
			continue
		}

		if err := database.DB.Create(&user).Error; err != nil {
			errors = append(errors, "Failed to create user "+username+": "+err.Error())
			continue
		}

		usersCreated++
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Successfully imported %d %ss", usersCreated, role),
		"count":   usersCreated,
		"errors":  errors,
	})
}
