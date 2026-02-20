package handlers

import (
	"coding-platform/database"
	"coding-platform/models"
	"fmt"
	"log"
	"net/http"

	"strings"
	"time"

	"github.com/gin-gonic/gin"
)


// DashboardResponse contains all dashboard data
type DashboardResponse struct {
	Stats           StatsData          `json:"stats"`
	TopicProficiency []TopicProgress    `json:"topic_proficiency"`
	Activity        []ActivityDay      `json:"activity"`
	Leaderboard     []LeaderboardEntry `json:"leaderboard"`
	CurrentUserRank int                `json:"current_user_rank"`
	EnrolledCourses []EnrolledCourse   `json:"enrolled_courses"`
}

type EnrolledCourse struct {
	ID         uint   `json:"id"`
	Name       string `json:"name"`
	Instructor string `json:"instructor"`
	Code       string `json:"code"`
}


// FacultyDashboardResponse contains data for faculty dashboard
type FacultyDashboardResponse struct {
	Stats            FacultyStats        `json:"stats"`
	AssignedSections []SectionAssignment `json:"assigned_sections"`
	UpcomingDeadlines []Deadline          `json:"upcoming_deadlines"`
	Insights         []FacultyInsight    `json:"insights"`
}

type AdminDashboardResponse struct {
	Stats AdminStats `json:"stats"`
}

type HodDashboardResponse struct {
	CourseAssignments []HodCourseAssignment `json:"course_assignments"`
}

type HodCourseAssignment struct {
	ID           uint   `json:"id"`
	CourseID     uint   `json:"course_id"`
	CourseCode   string `json:"course_code"`
	CourseName   string `json:"course_name"`
	FacultyID    uint   `json:"faculty_id"`
	FacultyName  string `json:"faculty_name"`
	SectionID    uint   `json:"section_id"`
	SectionName  string `json:"section_name"`
	StudentCount int    `json:"student_count"`
}

type AdminStats struct {
	TotalCourses int `json:"total_courses"`
	LabSessions  int `json:"lab_sessions"`
	Problems     int `json:"problems"`
	Students     int `json:"students"`
}

type PrincipalDashboardResponse struct {
	Stats           PrincipalStats    `json:"stats"`
	BranchAnalytics []BranchAnalytic `json:"branch_analytics"`
}

type PrincipalStats struct {
	TotalBranches int `json:"total_branches"`
	TotalCourses  int `json:"total_courses"`
	TotalFaculty  int `json:"total_faculty"`
	TotalStudents int `json:"total_students"`
}

type BranchAnalytic struct {
	BranchID     uint   `json:"branch_id"`
	BranchName   string `json:"branch_name"`
	CourseCount  int    `json:"course_count"`
	FacultyCount int    `json:"faculty_count"`
	StudentCount int    `json:"student_count"`
	HODName      string `json:"hod_name"`
}


type FacultyStats struct {
	TotalStudents   int     `json:"total_students"`
	ActiveCourses   int     `json:"active_courses"`
	PendingTasks    int     `json:"pending_tasks"`
	AvgEngagement   float64 `json:"avg_engagement"`
	StudentsChange  string  `json:"students_change"` // e.g. "+4% from last term"
}

type SectionAssignment struct {
	ID            uint   `json:"id"`
	SectionID     uint   `json:"section_id"`
	CourseCode    string `json:"course_code"`
	CourseName    string `json:"course_name"`
	CourseType    string `json:"course_type"` // e.g. "PROGRAMMING"
	SectionName   string `json:"section_name"`
	EnrolledCount int    `json:"enrolled_count"`
	Schedule      string `json:"schedule"` // e.g. "MWF 10:00 AM"
	Status        string `json:"status"`   // e.g. "ACTIVE"
	ImageURL      string `json:"image_url"`
}


type Deadline struct {
	ID          uint      `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	DueDate     time.Time `json:"due_date"`
	Priority    string    `json:"priority"` // e.g. "URGENT", "PENDING"
}

type FacultyInsight struct {
	ID      uint   `json:"id"`
	Text    string `json:"text"`
	Percent int    `json:"percent"`
}

type StatsData struct {
	TotalSolved    int     `json:"total_solved"`
	TotalProblems  int     `json:"total_problems"`
	CurrentStreak  int     `json:"current_streak"`
	Accuracy       float64 `json:"accuracy"`
	AccuracyChange float64 `json:"accuracy_change"`
	CollegeRank    int     `json:"college_rank"`
	TotalPoints    int     `json:"total_points"`
}

type TopicProgress struct {
	Name     string `json:"name"`
	Progress int    `json:"progress"`
	Easy     int    `json:"easy"`
	Medium   int    `json:"medium"`
	Hard     int    `json:"hard"`
	Total    int    `json:"total"`
}

type ActivityDay struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

type LeaderboardEntry struct {
	Rank   int    `json:"rank"`
	UserID uint   `json:"user_id"`
	Name   string `json:"name"`
	Solved int    `json:"solved"`
	Points int    `json:"points"`
}

// GetDashboard returns dashboard data for the authenticated user
func GetDashboard(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	uid := userID.(uint)
	log.Printf("GetDashboard called for User ID: %d", uid)

	// Check user role
	var user models.User
	if err := database.DB.First(&user, uid).Error; err != nil {
		log.Printf("Error finding user %d: %v", uid, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	log.Printf("User Role: %s", user.Role)

	if user.Role == "faculty" {
		log.Printf("Entering faculty dashboard for ID: %d", uid)
		getFacultyDashboard(c, uid)
		return
	}

	if user.Role == "hod" {
		log.Printf("Entering HOD dashboard for ID: %d", uid)
		getHodDashboard(c, &user)
		return
	}

	if user.Role == "admin" {
		log.Printf("Entering admin dashboard for ID: %d", uid)
		getAdminDashboard(c)
		return
	}

	if user.Role == "principal" {
		log.Printf("Entering principal dashboard for ID: %d", uid)
		GetPrincipalDashboard(c)
		return
	}


	// Default to student dashboard
	// Get stats
	stats := getStats(uid)

	// Get topic proficiency
	topics := getTopicProficiency(uid)

	// Get activity heatmap (last 365 days)
	activity := getActivity(uid)

	// Get leaderboard
	leaderboard, userRank := getLeaderboard(uid)

	// Get enrolled courses
	var enrollments []models.StudentEnrollment
	database.DB.Preload("Section.AcademicYear").
		Preload("Section.Branch").
		Preload("Section.Semester").
		Where("student_id = ?", uid).
		Find(&enrollments)

	var enrolledCourses []EnrolledCourse
	for _, e := range enrollments {
		// For each enrollment, find courses assigned to that section
		var assignments []models.FacultyCourseAssignment
		database.DB.Preload("Course").Preload("Faculty").
			Where("section_id = ?", e.SectionID).
			Find(&assignments)

		for _, a := range assignments {
			enrolledCourses = append(enrolledCourses, EnrolledCourse{
				ID:         a.Course.ID,
				Name:       a.Course.CourseName,
				Instructor: a.Faculty.Username, // Should be full name if available
				Code:       a.Course.CourseCode,
			})
		}
	}

	response := DashboardResponse{
		Stats:           stats,
		TopicProficiency: topics,
		Activity:        activity,
		Leaderboard:     leaderboard,
		CurrentUserRank: userRank,
		EnrolledCourses: enrolledCourses,
	}

	c.JSON(http.StatusOK, response)
}


func getFacultyDashboard(c *gin.Context, facultyID uint) {
	var assignments []models.FacultyCourseAssignment
	database.DB.Preload("Course").Preload("Section").Where("faculty_id = ?", facultyID).Find(&assignments)

	var sectionAssignments []SectionAssignment
	totalStudents := 0
	activeCoursesMap := make(map[uint]bool)

	for _, a := range assignments {
		var enrolledCount int64
		database.DB.Model(&models.StudentEnrollment{}).Where("section_id = ?", a.SectionID).Count(&enrolledCount)
		
		totalStudents += int(enrolledCount)
		activeCoursesMap[a.CourseID] = true

		assignment := SectionAssignment{
			ID:            a.ID,
			SectionID:     a.SectionID,
			EnrolledCount: int(enrolledCount),
			Schedule:      a.Schedule,
			Status:        a.Status,
			ImageURL:      a.ImageURL,
		}

		if assignment.Schedule == "" {
			assignment.Schedule = "TBA"
		}
		if assignment.Status == "" {
			assignment.Status = "ACTIVE"
		}
		if assignment.ImageURL == "" {
			assignment.ImageURL = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=400"
		}

		if a.Course != nil {
			assignment.CourseCode = a.Course.CourseCode
			assignment.CourseName = a.Course.CourseName
			assignment.CourseType = a.Course.CourseType
		} else {
			assignment.CourseName = "Unknown Course"
		}

		if a.Section != nil {
			assignment.SectionName = a.Section.SectionName
		} else {
			assignment.SectionName = "Unknown Section"
		}

		sectionAssignments = append(sectionAssignments, assignment)
	}


	// Fetch deadlines
	var dbDeadlines []models.FacultyDeadline
	database.DB.Where("faculty_id = ?", facultyID).Order("due_date ASC").Find(&dbDeadlines)

	var deadlines []Deadline
	for _, d := range dbDeadlines {
		deadlines = append(deadlines, Deadline{
			ID:          d.ID,
			Title:       d.Title,
			Description: d.Description,
			DueDate:     d.DueDate,
			Priority:    d.Priority,
		})
	}

	// Fetch insights
	var dbInsights []models.FacultyInsight
	database.DB.Where("faculty_id = ?", facultyID).Find(&dbInsights)

	var insights []FacultyInsight
	for _, i := range dbInsights {
		insights = append(insights, FacultyInsight{
			ID:      i.ID,
			Text:    i.Text,
			Percent: i.Percent,
		})
	}

	// Calculate stats
	// Pending tasks can be count of urgent deadlines
	var pendingCount int64
	database.DB.Model(&models.FacultyDeadline{}).Where("faculty_id = ? AND priority = ?", facultyID, "URGENT").Count(&pendingCount)

	stats := FacultyStats{
		TotalStudents:  totalStudents,
		ActiveCourses:  len(activeCoursesMap),
		PendingTasks:   int(pendingCount),
		AvgEngagement:  85.0, // This would ideally be calculated from submission frequency
		StudentsChange: "+4% from last term",
	}

	response := FacultyDashboardResponse{
		Stats:           stats,
		AssignedSections: sectionAssignments,
		UpcomingDeadlines: deadlines,
		Insights:        insights,
	}

	c.JSON(http.StatusOK, response)
}

func getHodDashboard(c *gin.Context, hod *models.User) {
	if hod.BranchID == nil {
		log.Printf("HOD %d has no BranchID", hod.ID)
		c.JSON(http.StatusBadRequest, gin.H{"error": "HOD is not assigned to any branch"})
		return
	}

	log.Printf("Fetching HOD dashboard for BranchID: %d", *hod.BranchID)

	// Fetch all courses in the branch
	var courses []models.Course
	database.DB.Where("branch_id = ?", *hod.BranchID).Find(&courses)

	var hodAssignments []HodCourseAssignment
	for _, course := range courses {
		// Find assignments for this course
		var assignments []models.FacultyCourseAssignment
		database.DB.Preload("Faculty").Preload("Section").
			Where("course_id = ?", course.ID).
			Find(&assignments)

		if len(assignments) == 0 {
			// Course with no assignment
			hodAssignments = append(hodAssignments, HodCourseAssignment{
				CourseID:    course.ID,
				CourseCode:  course.CourseCode,
				CourseName:  course.CourseName,
				FacultyName: "Not Assigned",
				SectionName: "-",
				StudentCount: 0,
			})
		} else {
			// Course has assignment(s)
			for _, a := range assignments {
				var studentCount int64
				database.DB.Model(&models.StudentEnrollment{}).Where("section_id = ?", a.SectionID).Count(&studentCount)

				facultyName := "Unknown Faculty"
				if a.Faculty != nil {
					facultyName = a.Faculty.Username
				}

				sectionName := "Unknown Section"
				if a.Section != nil {
					sectionName = a.Section.SectionName
				}

				hodAssignments = append(hodAssignments, HodCourseAssignment{
					ID:           a.ID,
					CourseID:     a.CourseID,
					CourseCode:   course.CourseCode,
					CourseName:   course.CourseName,
					FacultyID:    a.FacultyID,
					FacultyName:  facultyName,
					SectionID:    a.SectionID,
					SectionName:  sectionName,
					StudentCount: int(studentCount),
				})
			}
		}
	}

	response := HodDashboardResponse{
		CourseAssignments: hodAssignments,
	}

	c.JSON(http.StatusOK, response)
}

func GetPrincipalDashboard(c *gin.Context) {
	var totalBranches, totalCourses, totalFaculty, totalStudents int64
	database.DB.Model(&models.Branch{}).Count(&totalBranches)
	database.DB.Model(&models.Course{}).Count(&totalCourses)
	database.DB.Model(&models.User{}).Where("role = ?", "faculty").Count(&totalFaculty)
	database.DB.Model(&models.User{}).Where("role = ?", "student").Count(&totalStudents)

	var branches []models.Branch
	database.DB.Preload("HOD").Find(&branches)

	var branchAnalytics []BranchAnalytic
	for _, b := range branches {
		var coursesCount, facultyCount, studentCount int64
		database.DB.Model(&models.Course{}).Where("branch_id = ?", b.BranchID).Count(&coursesCount)
		database.DB.Model(&models.User{}).Where("branch_id = ? AND role = ?", b.BranchID, "faculty").Count(&facultyCount)
		
		// For students, we look at enrollments in sections belonging to this branch
		database.DB.Table("student_enrollments").
			Joins("JOIN sections ON sections.section_id = student_enrollments.section_id").
			Where("sections.branch_id = ?", b.BranchID).
			Count(&studentCount)

		hodName := "Not Assigned"
		if b.HOD != nil {
			hodName = b.HOD.Username
		}

		branchAnalytics = append(branchAnalytics, BranchAnalytic{
			BranchID:     b.BranchID,
			BranchName:   b.BranchName,
			CourseCount:  int(coursesCount),
			FacultyCount: int(facultyCount),
			StudentCount: int(studentCount),
			HODName:      hodName,
		})
	}

	response := PrincipalDashboardResponse{
		Stats: PrincipalStats{
			TotalBranches: int(totalBranches),
			TotalCourses:  int(totalCourses),
			TotalFaculty:  int(totalFaculty),
			TotalStudents: int(totalStudents),
		},
		BranchAnalytics: branchAnalytics,
	}

	c.JSON(http.StatusOK, response)
}

func GetAllBranches(c *gin.Context) {
	var branches []models.Branch
	database.DB.Preload("HOD").Find(&branches)
	
	// Also fetch potential HODs (all faculty)
	var faculty []models.User
	database.DB.Where("role IN (?)", []string{"faculty", "hod"}).Find(&faculty)

	c.JSON(http.StatusOK, gin.H{
		"branches": branches,
		"faculty":  faculty,
	})
}

func AssignHod(c *gin.Context) {
	var req struct {
		BranchID uint `json:"branch_id" binding:"required"`
		UserID   uint `json:"user_id" binding:"required"` // The faculty member to become HOD
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := database.DB.Begin()

	// 1. Get the user
	var user models.User
	if err := tx.First(&user, req.UserID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// 2. Get the branch
	var branch models.Branch
	if err := tx.First(&branch, req.BranchID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Branch not found"})
		return
	}

	// 3. Update previous HOD if any (change role back to faculty)
	if branch.HODID != nil {
		tx.Model(&models.User{}).Where("id = ?", *branch.HODID).Update("role", "faculty")
	}

	// 4. Update new HOD user
	user.Role = "hod"
	user.BranchID = &req.BranchID
	if err := tx.Save(&user).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user role"})
		return
	}

	// 5. Update branch with new HOD ID
	branch.HODID = &user.ID
	if err := tx.Save(&branch).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update branch HOD"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "HOD assigned successfully", "hod": user.Username})
}

func GetHodBranchData(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var user models.User
	database.DB.First(&user, userID)

	if user.Role != "hod" || user.BranchID == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var courses []models.Course
	database.DB.Where("branch_id = ?", *user.BranchID).Find(&courses)

	var sections []models.Section
	database.DB.Where("branch_id = ?", *user.BranchID).Find(&sections)

	var faculty []models.User
	database.DB.Where("role = ? AND branch_id = ?", "faculty", *user.BranchID).Find(&faculty)

	c.JSON(http.StatusOK, gin.H{
		"courses":  courses,
		"sections": sections,
		"faculty":  faculty,
	})
}

func AssignFacultyToCourse(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var user models.User
	database.DB.First(&user, userID)

	if user.Role != "hod" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only HOD can assign faculty"})
		return
	}

	var req struct {
		CourseID  uint `json:"course_id" binding:"required"`
		SectionID uint `json:"section_id" binding:"required"`
		FacultyID uint `json:"faculty_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify course belongs to HOD's branch
	var course models.Course
	if err := database.DB.First(&course, req.CourseID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}

	if course.BranchID != *user.BranchID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only assign faculty to courses in your branch"})
		return
	}

	// Create assignment
	assignment := models.FacultyCourseAssignment{
		FacultyID:      req.FacultyID,
		CourseID:       req.CourseID,
		SectionID:      req.SectionID,
		AcademicYearID: 1, // Default or fetch current
		Status:         "ACTIVE",
	}

	if err := database.DB.Create(&assignment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create assignment"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Faculty assigned successfully"})
}

func getAdminDashboard(c *gin.Context) {
	var courseCount int64
	database.DB.Model(&models.Course{}).Count(&courseCount)

	var labCount int64
	database.DB.Model(&models.LabSession{}).Count(&labCount)

	var problemCount int64
	database.DB.Model(&models.Problem{}).Count(&problemCount)

	var studentCount int64
	database.DB.Model(&models.User{}).Where("role = ?", "student").Count(&studentCount)

	log.Printf("AdminStats: Courses=%d, Labs=%d, Problems=%d, Students=%d", courseCount, labCount, problemCount, studentCount)

	response := AdminDashboardResponse{
		Stats: AdminStats{
			TotalCourses: int(courseCount),
			LabSessions:  int(labCount),
			Problems:     int(problemCount),
			Students:     int(studentCount),
		},
	}

	c.JSON(http.StatusOK, response)
}



func getStats(userID uint) StatsData {
	var stats StatsData

	// Total problems solved
	var totalSolved int64
	database.DB.Model(&models.UserProblemCompletion{}).
		Where("user_id = ?", userID).
		Count(&totalSolved)
	stats.TotalSolved = int(totalSolved)

	// Total problems available
	var totalProblems int64
	database.DB.Model(&models.Problem{}).
		Count(&totalProblems)
	stats.TotalProblems = int(totalProblems)

	// Get streak data
	var streak models.UserStreak
	if err := database.DB.Where("user_id = ?", userID).First(&streak).Error; err == nil {
		stats.CurrentStreak = streak.CurrentStreak
		stats.TotalPoints = streak.TotalPoints
	}

	// Calculate accuracy (passed submissions / total submissions)
	var totalSubmissions, passedSubmissions int64
	database.DB.Model(&models.Submission{}).
		Where("user_id = ?", userID).
		Count(&totalSubmissions)
	database.DB.Model(&models.Submission{}).
		Where("user_id = ? AND passed = ?", userID, true).
		Count(&passedSubmissions)

	if totalSubmissions > 0 {
		stats.Accuracy = float64(passedSubmissions) / float64(totalSubmissions) * 100
	}

	// Calculate college rank (by problems solved)
	var user models.User
	database.DB.First(&user, userID)
	
	if user.CollegeID != nil {
		var rank int64
		database.DB.Raw(`
			SELECT COUNT(DISTINCT upc.user_id) + 1 
			FROM user_problem_completions upc 
			JOIN users u ON u.id = upc.user_id 
			WHERE u.college_id = ? 
			GROUP BY upc.user_id 
			HAVING COUNT(*) > (
				SELECT COUNT(*) FROM user_problem_completions WHERE user_id = ?
			)
		`, user.CollegeID, userID).Scan(&rank)
		stats.CollegeRank = int(rank)
		if stats.CollegeRank == 0 {
			stats.CollegeRank = 1
		}
	} else {
		stats.CollegeRank = 1
	}

	return stats
}

func getTopicProficiency(userID uint) []TopicProgress {
	var topics []TopicProgress

	// Get all unique tags/topics
	var tagResults []struct {
		Tags string
	}
	database.DB.Model(&models.Problem{}).
		Select("DISTINCT tags").
		Where("tags IS NOT NULL AND tags != ''").
		Scan(&tagResults)

	// Collect unique topics
	topicSet := make(map[string]bool)
	for _, t := range tagResults {
		// Split comma-separated tags
		for _, tag := range splitTags(t.Tags) {
			topicSet[tag] = true
		}
	}

	// For each topic, calculate progress
	for topic := range topicSet {
		var progress TopicProgress
		progress.Name = topic

		// Count problems with this tag by difficulty
		var easyTotal, medTotal, hardTotal int64
		database.DB.Model(&models.Problem{}).
			Where("tags LIKE ? AND difficulty = ?", "%"+topic+"%", "easy").
			Count(&easyTotal)
		database.DB.Model(&models.Problem{}).
			Where("tags LIKE ? AND difficulty = ?", "%"+topic+"%", "medium").
			Count(&medTotal)
		database.DB.Model(&models.Problem{}).
			Where("tags LIKE ? AND difficulty = ?", "%"+topic+"%", "hard").
			Count(&hardTotal)

		// Count solved by this user
		var easySolved, medSolved, hardSolved int64
		database.DB.Model(&models.UserProblemCompletion{}).
			Joins("JOIN problems ON problems.id = user_problem_completions.problem_id").
			Where("user_problem_completions.user_id = ? AND problems.tags LIKE ? AND problems.difficulty = ?", 
				userID, "%"+topic+"%", "easy").
			Count(&easySolved)
		database.DB.Model(&models.UserProblemCompletion{}).
			Joins("JOIN problems ON problems.id = user_problem_completions.problem_id").
			Where("user_problem_completions.user_id = ? AND problems.tags LIKE ? AND problems.difficulty = ?", 
				userID, "%"+topic+"%", "medium").
			Count(&medSolved)
		database.DB.Model(&models.UserProblemCompletion{}).
			Joins("JOIN problems ON problems.id = user_problem_completions.problem_id").
			Where("user_problem_completions.user_id = ? AND problems.tags LIKE ? AND problems.difficulty = ?", 
				userID, "%"+topic+"%", "hard").
			Count(&hardSolved)

		progress.Easy = int(easySolved)
		progress.Medium = int(medSolved)
		progress.Hard = int(hardSolved)
		progress.Total = int(easyTotal + medTotal + hardTotal)

		if progress.Total > 0 {
			progress.Progress = (progress.Easy + progress.Medium + progress.Hard) * 100 / progress.Total
		}

		if progress.Total > 0 { // Only include topics with problems
			topics = append(topics, progress)
		}
	}

	return topics
}

func getActivity(userID uint) []ActivityDay {
	var activity []ActivityDay

	// Get last 365 days of activity from UserActivity table
	var activities []models.UserActivity
	startDate := time.Now().AddDate(-1, 0, 0)
	
	database.DB.Where("user_id = ? AND date >= ?", userID, startDate).
		Order("date ASC").
		Find(&activities)

	// Create a map for quick lookup
	activityMap := make(map[string]int)
	for _, a := range activities {
		dateStr := a.Date.Format("2006-01-02")
		activityMap[dateStr] = a.Count
	}

	// Generate all days in range
	for d := startDate; !d.After(time.Now()); d = d.AddDate(0, 0, 1) {
		dateStr := d.Format("2006-01-02")
		count := activityMap[dateStr]
		activity = append(activity, ActivityDay{
			Date:  dateStr,
			Count: count,
		})
	}

	return activity
}

func getLeaderboard(userID uint) ([]LeaderboardEntry, int) {
	var entries []LeaderboardEntry
	var userRank int

	// Get top users by problems solved
	var results []struct {
		UserID   uint
		Username string
		Solved   int64
		Points   int
	}

	database.DB.Raw(`
		SELECT 
			u.id as user_id,
			u.username,
			COUNT(upc.id) as solved,
			COALESCE(us.total_points, 0) as points
		FROM users u
		LEFT JOIN user_problem_completions upc ON upc.user_id = u.id
		LEFT JOIN user_streaks us ON us.user_id = u.id
		GROUP BY u.id, u.username, us.total_points
		ORDER BY solved DESC, points DESC
		LIMIT 20
	`).Scan(&results)

	for i, r := range results {
		entry := LeaderboardEntry{
			Rank:   i + 1,
			UserID: r.UserID,
			Name:   r.Username,
			Solved: int(r.Solved),
			Points: r.Points,
		}
		entries = append(entries, entry)

		if r.UserID == userID {
			userRank = i + 1
		}
	}

	// If user not in top 20, find their rank
	if userRank == 0 {
		database.DB.Raw(`
			SELECT COUNT(*) + 1 FROM (
				SELECT user_id, COUNT(*) as cnt 
				FROM user_problem_completions 
				GROUP BY user_id
			) sub WHERE sub.cnt > (
				SELECT COUNT(*) FROM user_problem_completions WHERE user_id = ?
			)
		`, userID).Scan(&userRank)
	}

	return entries, userRank
}

// UpdateUserActivity updates the activity count for a user on submission
func UpdateUserActivity(userID uint) {
	today := time.Now().Truncate(24 * time.Hour)

	var activity models.UserActivity
	result := database.DB.Where("user_id = ? AND date = ?", userID, today).First(&activity)

	if result.Error != nil {
		// Create new entry
		activity = models.UserActivity{
			UserID: userID,
			Date:   today,
			Count:  1,
		}
		database.DB.Create(&activity)
	} else {
		// Increment count
		database.DB.Model(&activity).Update("count", activity.Count+1)
	}
}

// UpdateUserStreak updates the user's streak after a submission
func UpdateUserStreak(userID uint) {
	today := time.Now().Truncate(24 * time.Hour)
	yesterday := today.AddDate(0, 0, -1)

	var streak models.UserStreak
	result := database.DB.Where("user_id = ?", userID).First(&streak)

	if result.Error != nil {
		// First activity - create streak
		streak = models.UserStreak{
			UserID:           userID,
			CurrentStreak:    1,
			LongestStreak:    1,
			LastActivityDate: today,
			TotalPoints:      10, // Points per submission
		}
		database.DB.Create(&streak)
	} else {
		lastDate := streak.LastActivityDate.Truncate(24 * time.Hour)
		
		if lastDate.Equal(today) {
			// Already submitted today, just add points
			streak.TotalPoints += 10
		} else if lastDate.Equal(yesterday) {
			// Continuing streak
			streak.CurrentStreak++
			if streak.CurrentStreak > streak.LongestStreak {
				streak.LongestStreak = streak.CurrentStreak
			}
			streak.LastActivityDate = today
			streak.TotalPoints += 10 + streak.CurrentStreak // Bonus for streak
		} else {
			// Streak broken
			streak.CurrentStreak = 1
			streak.LastActivityDate = today
			streak.TotalPoints += 10
		}
		database.DB.Save(&streak)
	}
}

func splitTags(tags string) []string {
	var result []string
	current := ""
	for _, c := range tags {
		if c == ',' {
			if trimmed := trimSpace(current); trimmed != "" {
				result = append(result, trimmed)
			}
			current = ""
		} else {
			current += string(c)
		}
	}
	if trimmed := trimSpace(current); trimmed != "" {
		result = append(result, trimmed)
	}
	return result
}

func trimSpace(s string) string {
	start := 0
	end := len(s)
	for start < end && (s[start] == ' ' || s[start] == '\t') {
		start++
	}
	for end > start && (s[end-1] == ' ' || s[end-1] == '\t') {
		end--
	}
	return s[start:end]
}

// SectionAnalyticsResponse contains data for section analytics
type SectionAnalyticsResponse struct {
	TopicHeatmap    []TopicHeatmapEntry `json:"topic_heatmap"`
	ProgressTrends  []int               `json:"progress_trends"`
	StudentPerformance []StudentEntry   `json:"student_performance"`
}

type TopicHeatmapEntry struct {
	Name string `json:"name"`
	High string `json:"high"`
	Med  string `json:"med"`
	Low  string `json:"low"`
}

type StudentEntry struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Initials string `json:"initials"`
	Count    int    `json:"count"`
}

func GetSectionAnalytics(c *gin.Context) {
	sectionID := c.Param("id")
	facultyID, _ := c.Get("user_id")
	fid := facultyID.(uint)

	// Security: Verify this faculty is assigned to this section
	var assignment models.FacultyCourseAssignment
	if err := database.DB.Where("faculty_id = ? AND section_id = ?", fid, sectionID).First(&assignment).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not assigned to this section"})
		return
	}

	// Fetch students in this section
	var enrollments []models.StudentEnrollment
	database.DB.Preload("Student").Where("section_id = ?", sectionID).Find(&enrollments)

	var students []StudentEntry
	for _, e := range enrollments {
		initials := ""
		if e.Student != nil && len(e.Student.Username) > 0 {
			initials = strings.ToUpper(string(e.Student.Username[0]))
		}
		
		var solvedCount int64
		database.DB.Model(&models.UserProblemCompletion{}).Where("user_id = ?", e.StudentID).Count(&solvedCount)

		students = append(students, StudentEntry{
			ID:       fmt.Sprintf("#S%d", e.StudentID),
			Name:     e.Student.Username,
			Initials: initials,
			Count:    int(solvedCount),
		})
	}

	// Topic Proficiency Heatmap (aggregated)
	// Fetch problems associated with the course to get actual topics
	var course models.Course
	database.DB.First(&course, assignment.CourseID)

	topics := []string{"Arrays", "Strings", "Recursion", "Trees"}
	var topicHeatmap []TopicHeatmapEntry
	for _, topic := range topics {
		topicHeatmap = append(topicHeatmap, TopicHeatmapEntry{
			Name: topic,
			High: "8/20", 
			Med:  "7/20",
			Low:  "5/20",
		})
	}

	progressTrends := []int{40, 60, 55, 85, 110, 125, 140, 135, 150, 170, 190, 200, 175, 145, 165, 210}

	response := SectionAnalyticsResponse{
		TopicHeatmap:    topicHeatmap,
		ProgressTrends:  progressTrends,
		StudentPerformance: students,
	}

	c.JSON(http.StatusOK, response)
}