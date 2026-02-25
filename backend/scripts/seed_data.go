package main

import (
	"coding-platform/config"
	"coding-platform/database"
	"coding-platform/models"
	"log"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	if err := config.LoadConfig(); err != nil {
		log.Fatal(err)
	}
	if err := database.Connect(); err != nil {
		log.Fatal(err)
	}

	// Clear some tables to start fresh (optional, be careful)
	// database.DB.Exec("DELETE FROM submissions")
	// database.DB.Exec("DELETE FROM faculty_course_assignments")

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

	// 1. Create College
	college := models.College{
		CollegeName: "Engineering Institute of Technology",
		ShortName:   "EIT",
		Address:     "123 Tech Park, Innovation City",
		IsActive:    true,
	}
	database.DB.FirstOrCreate(&college, models.College{ShortName: "EIT"})

	// 2. Create Program and Semester
	program := models.Program{
		ProgramCode:   "CS",
		ProgramName:   "Computer Science",
		DurationYears: 4,
	}
	database.DB.FirstOrCreate(&program, models.Program{ProgramCode: "CS"})

	semester := models.Semester{
		ProgramID:      program.ProgramID,
		SemesterNumber: 4,
	}
	database.DB.FirstOrCreate(&semester, models.Semester{ProgramID: program.ProgramID, SemesterNumber: 4})

	branch := models.Branch{
		BranchName: "Software Engineering",
		ShortName:  "SE",
		CollegeID:  college.CollegeID,
		ProgramID:  program.ProgramID,
	}
	database.DB.FirstOrCreate(&branch, models.Branch{ShortName: "SE"})

	ay := models.AcademicYear{
		YearStart: 2024,
		YearEnd:   2025,
		IsCurrent: true,
	}
	database.DB.FirstOrCreate(&ay, models.AcademicYear{YearStart: 2024, YearEnd: 2025})

	section := models.Section{
		SectionName:    "A",
		SemesterID:     semester.SemesterID,
		BranchID:       branch.BranchID,
		AcademicYearID: ay.AcademicYearID,
	}
	database.DB.FirstOrCreate(&section, models.Section{SectionName: "A", SemesterID: semester.SemesterID})

	// 3. Create Faculty
	faculty := models.User{
		Username: "prof_smith",
		Email:    "smith@eit.edu",
		Password: string(hashedPassword),
		Role:     "faculty",
	}
	database.DB.FirstOrCreate(&faculty, models.User{Username: "prof_smith"})

	// 4. Create Courses
	courses := []models.Course{
		{CourseCode: "CS201", CourseName: "Data Structures", CourseType: "lab", SemesterID: semester.SemesterID, BranchID: branch.BranchID, Credits: 4},
		{CourseCode: "CS202", CourseName: "Algorithms", CourseType: "theory", SemesterID: semester.SemesterID, BranchID: branch.BranchID, Credits: 3},
	}
	for i := range courses {
		database.DB.FirstOrCreate(&courses[i], models.Course{CourseCode: courses[i].CourseCode})
		
		schedule := "Mon, Wed 10:00 AM"
		image := "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=400"
		if courses[i].CourseCode == "CS202" {
			schedule = "Fri 9:00 AM - 12:00 PM"
			image = "https://images.unsplash.com/photo-1509228468518-180dd486490e?auto=format&fit=crop&q=80&w=400"
		}

		// Assign to faculty
		assignment := models.FacultyCourseAssignment{
			FacultyID:      faculty.ID,
			CourseID:       courses[i].ID,
			SectionID:      section.SectionID,
			AcademicYearID: ay.AcademicYearID,
			Schedule:       schedule,
			Status:         "ACTIVE",
			ImageURL:       image,
		}
		database.DB.FirstOrCreate(&assignment, models.FacultyCourseAssignment{FacultyID: faculty.ID, CourseID: courses[i].ID, SectionID: section.SectionID})
	}


	// 5. Create Faculty Deadlines and Insights
	deadlines := []models.FacultyDeadline{
		{FacultyID: faculty.ID, Title: "Grade Data Structures Lab", Description: "Submit grades for Lab 5", DueDate: time.Now().AddDate(0, 0, 2), Priority: "URGENT"},
		{FacultyID: faculty.ID, Title: "Prepare Midterm", Description: "Algorithms midterm exam draft", DueDate: time.Now().AddDate(0, 0, 5), Priority: "PENDING"},
	}
	for i := range deadlines {
		database.DB.Create(&deadlines[i])
	}

	insights := []models.FacultyInsight{
		{FacultyID: faculty.ID, Text: "85% of section A completed the last assignment on time.", Percent: 85},
		{FacultyID: faculty.ID, Text: "Average score in Data Structures has improved by 12%.", Percent: 12},
	}
	for i := range insights {
		database.DB.Create(&insights[i])
	}

	// 6. Create Students and Enrollments
	students := []models.User{
		{Username: "alice", Email: "alice@student.com", Password: string(hashedPassword), Role: "student"},
		{Username: "bob", Email: "bob@student.com", Password: string(hashedPassword), Role: "student"},
	}
	for i := range students {
		database.DB.FirstOrCreate(&students[i], models.User{Username: students[i].Username})
		enrollment := models.StudentEnrollment{
			StudentID:      students[i].ID,
			SectionID:      section.SectionID,
			AcademicYearID: ay.AcademicYearID,
		}
		database.DB.FirstOrCreate(&enrollment, models.StudentEnrollment{StudentID: students[i].ID, SectionID: section.SectionID})
	}

	// 7. Create Problems and Submissions for Stats
	problem := models.Problem{
		Title:       "Binary Search",
		Description: "Implement binary search",
		Difficulty:  "easy",
		Tags:        "Arrays,Search",
	}
	database.DB.FirstOrCreate(&problem, models.Problem{Title: "Binary Search"})

	submission := models.Submission{
		UserID:      students[0].ID,
		ProblemID:   problem.ID,
		Passed:      true,
		Status:      "Accepted",
		SubmittedAt: time.Now(),
	}
	database.DB.Create(&submission)

	completion := models.UserProblemCompletion{
		UserID:    students[0].ID,
		ProblemID: problem.ID,
	}
	database.DB.FirstOrCreate(&completion, models.UserProblemCompletion{UserID: students[0].ID, ProblemID: problem.ID})

	// 8. Create specific user faculty_it
	facultyIT := models.User{
		Username: "faculty_it",
		Email:    "it_dept@eit.edu",
		Password: string(hashedPassword),
		Role:     "faculty",
	}
	database.DB.FirstOrCreate(&facultyIT, models.User{Username: "faculty_it"})

	itCourse := models.Course{
		CourseCode: "IT301",
		CourseName: "Web Engineering",
		CourseType: "lab",
		SemesterID: semester.SemesterID,
		BranchID:   branch.BranchID,
		Credits:    4,
	}
	database.DB.FirstOrCreate(&itCourse, models.Course{CourseCode: "IT301"})

	itAssignment := models.FacultyCourseAssignment{
		FacultyID:      facultyIT.ID,
		CourseID:       itCourse.ID,
		SectionID:      section.SectionID,
		AcademicYearID: ay.AcademicYearID,
		Schedule:       "Tue, Thu 2:00 PM - 4:00 PM",
		Status:         "ACTIVE",
		ImageURL:       "https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&q=80&w=400",
	}
	database.DB.FirstOrCreate(&itAssignment, models.FacultyCourseAssignment{FacultyID: facultyIT.ID, CourseID: itCourse.ID, SectionID: section.SectionID})


	itDeadlines := []models.FacultyDeadline{
		{FacultyID: facultyIT.ID, Title: "Finalize React Syllabus", Description: "Update syllabus for upcoming term", DueDate: time.Now().AddDate(0, 0, 3), Priority: "PENDING"},
	}
	for i := range itDeadlines {
		database.DB.Create(&itDeadlines[i])
	}

	log.Println("Database seeded successfully with comprehensive mock data, including faculty_it!")
}

