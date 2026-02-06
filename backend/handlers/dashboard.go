package handlers

import (
	"coding-platform/database"
	"coding-platform/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// DashboardResponse contains all dashboard data
type DashboardResponse struct {
	Stats          StatsData         `json:"stats"`
	TopicProficiency []TopicProgress `json:"topic_proficiency"`
	Activity       []ActivityDay     `json:"activity"`
	Leaderboard    []LeaderboardEntry `json:"leaderboard"`
	CurrentUserRank int              `json:"current_user_rank"`
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
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	uid := userID.(uint)

	// Get stats
	stats := getStats(uid)

	// Get topic proficiency
	topics := getTopicProficiency(uid)

	// Get activity heatmap (last 365 days)
	activity := getActivity(uid)

	// Get leaderboard
	leaderboard, userRank := getLeaderboard(uid)

	response := DashboardResponse{
		Stats:          stats,
		TopicProficiency: topics,
		Activity:       activity,
		Leaderboard:    leaderboard,
		CurrentUserRank: userRank,
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
