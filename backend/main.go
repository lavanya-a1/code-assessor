package main

import (
	"coding-platform/config"
	"coding-platform/database"
	"coding-platform/handlers"
	"coding-platform/middleware"
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	if err := config.LoadConfig(); err != nil {
		log.Fatal("Failed to load config:", err)
	}

	// Connect to database
	if err := database.Connect(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Run migrations
	if err := database.Migrate(); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Set Gin mode
	gin.SetMode(config.AppConfig.GinMode)

	// Create router
	router := gin.Default()

	// CORS middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// API routes
	api := router.Group("/api")
	{
		// Public routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
		}

		// Public problem routes (read-only)
		api.GET("/problems", handlers.GetProblems)
		api.GET("/problems/:id", handlers.GetProblem)

		// Code execution - run is public, submit requires auth
		api.POST("/run", handlers.RunCode)

		// Public submission queries
		api.GET("/submissions", handlers.GetSubmissions)
		api.GET("/submissions/:id", handlers.GetSubmission)
		api.GET("/submissions/stats", handlers.GetSubmissionStats)

		// Protected routes
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			// User's own submissions and completed problems
			protected.GET("/my/submissions", handlers.GetUserSubmissions)
			protected.GET("/my/completed-problems", handlers.GetUserCompletedProblems)
			protected.GET("/dashboard", handlers.GetDashboard)
			protected.POST("/submit", handlers.SubmitCode)
			protected.GET("/problems/:id/submissions", handlers.GetProblemSubmissions)
			
			// Admin and Faculty routes
			facultyGroup := protected.Group("")
			facultyGroup.Use(middleware.FacultyOrAdmin())
			{
				facultyGroup.GET("/sections/:id/analytics", handlers.GetSectionAnalytics)
				
				// Keep admin routes separate if needed, or use same group
				admin := facultyGroup.Group("")
				// Note: if you want ONLY admin for these, you'd need a separate AdminOnly middleware
				// But for now let's assume faculty can also manage problems based on your needs
				{
					admin.POST("/problems", handlers.CreateProblem)
					admin.PUT("/problems/:id", handlers.UpdateProblem)
					admin.DELETE("/problems/:id", handlers.DeleteProblem)
					admin.POST("/problems/:id/testcases", handlers.CreateTestCase)
					admin.GET("/problems/:id/testcases", handlers.GetTestCases)
					admin.DELETE("/problems/:id/testcases/:testcase_id", handlers.DeleteTestCase)
					
					// Plagiarism detection routes
					admin.GET("/plagiarism/submissions/:id", handlers.CheckSubmissionPlagiarism)
					admin.GET("/plagiarism/problems/:id", handlers.CheckProblemPlagiarism)
					admin.GET("/plagiarism/results/:problem_id", handlers.GetPlagiarismResults)

					// Course routes
					admin.GET("/courses", handlers.GetCourses)
					admin.POST("/courses", handlers.CreateCourse)

					// Lab session routes
					admin.GET("/lab-sessions", handlers.GetLabSessions)
					admin.POST("/lab-sessions", handlers.CreateLabSession)

					// Contest routes
					admin.GET("/contests", handlers.GetContests)
					admin.POST("/contests", handlers.CreateContest)

					// --- Additional Admin Management Routes ---
					admin.GET("/admin/stats", handlers.GetAdminStats)
					admin.GET("/admin/users", handlers.GetAdminUsers)
					admin.POST("/admin/users", handlers.CreateAdminUser)
					admin.POST("/admin/users/:id/toggle-active", handlers.ToggleUserActive)
					admin.GET("/admin/users/template", handlers.DownloadUserTemplate)
					admin.POST("/admin/users/bulk", handlers.BulkCreateUsers)
					admin.GET("/admin/problems", handlers.GetAllProblemsForAdmin)

					// Detail Course Session Routes
					admin.GET("/courses/:id/sessions", handlers.GetCourseSessions)
					admin.POST("/courses/:id/sessions", handlers.CreateSession)
					admin.DELETE("/courses/:id/sessions/:session_id", handlers.DeleteSession)
					admin.GET("/courses/:id/sessions/:session_id/problems", handlers.GetSessionProblems)
					admin.POST("/courses/:id/sessions/:session_id/problems", handlers.AddProblemToSession)
					admin.DELETE("/courses/:id/sessions/:session_id/problems/:problem_id", handlers.RemoveProblemFromSession)
					admin.GET("/courses/:id/sessions/:session_id/lessons", handlers.GetSessionLessons)
					admin.PUT("/courses/:id/sessions/:session_id/lessons", handlers.UpdateSessionLesson)
				}

				// HOD routes
				hod := facultyGroup.Group("")
				{
					hod.GET("/hod/branch-data", handlers.GetHodBranchData)
					hod.POST("/hod/assign-faculty", handlers.AssignFacultyToCourse)
				}
			}

			// Principal routes
			principal := protected.Group("/principal")
			principal.Use(middleware.PrincipalOnly())
			{
				principal.GET("/dashboard", handlers.GetPrincipalDashboard)
				principal.GET("/branches", handlers.GetAllBranches)
				principal.POST("/assign-hod", handlers.AssignHod)
			}





			// Authenticated user routes
			// protected.GET("/problems/:id/testcases", handlers.GetTestCases) // This route is now in the admin group
		}
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Start server
	log.Printf("Server starting on port %s", config.AppConfig.Port)
	if err := router.Run(":" + config.AppConfig.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
