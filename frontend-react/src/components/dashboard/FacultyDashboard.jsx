import { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import './FacultyDashboard.css';

const FacultyDashboard = ({ onSelectCourse }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await dashboardAPI.getData();
                setData(response);
            } catch (error) {
                console.error('Error fetching dashboard:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) return <div className="loading-container">
        <div className="loader"></div>
        <p>Loading Faculty Dashboard...</p>
    </div>;

    if (!data) return <div className="error-container">
        <p>Failed to load dashboard data. Please try again later.</p>
    </div>;

    if (!data) return <div className="error-container">
        <p>Failed to load dashboard data. Please try again later.</p>
    </div>;

    const { stats, assigned_sections, upcoming_deadlines, insights } = data;


    return (
        <div className="faculty-dashboard">
            <header className="faculty-header">
                <h1>My Courses</h1>
                <p>Welcome back. Here's an overview of your active sections.</p>
            </header>

            <div className="faculty-stats">
                <StatCard label="Total Students" value={stats.total_students} color="blue" icon="👥" />
                <StatCard label="Active Courses" value={stats.active_courses} subtitle="Current Semester Sections" color="purple" icon="📘" />
                <StatCard label="Pending Tasks" value={stats.pending_tasks} subtitle="Needs grading this week" color="orange" icon="⚠️" />
                <StatCard label="Avg. Engagement" value={`${stats.avg_engagement}%`} progress={stats.avg_engagement} color="cyan" icon="📈" />
            </div>

            <div className="sections-container">
                <div className="sections-header">
                    <h2>Assigned Sections</h2>
                    <div className="view-controls">
                        <button className="view-btn active">▦</button>
                        <button className="view-btn">≡</button>
                    </div>
                </div>
                <div className="sections-grid">
                    {assigned_sections && assigned_sections.map(section => (
                        <SectionCard key={section.id} section={section} onClick={() => onSelectCourse(section)} />
                    ))}
                </div>
            </div>

            <div className="bottom-grid">
                <div className="deadlines-card">
                    <div className="card-header-flex">
                        <h3>Upcoming Deadlines</h3>
                        <span className="calendar-icon">📅</span>
                    </div>
                    <div className="deadlines-list">
                        {upcoming_deadlines && upcoming_deadlines.map(deadline => (
                            <div key={deadline.id} className="deadline-item">
                                <div className="deadline-icon-box">📋</div>
                                <div className="deadline-info">
                                    <div className="deadline-title">{deadline.title}</div>
                                    <div className="deadline-desc">{deadline.description}</div>
                                </div>
                                <span className={`priority-badge priority-${deadline.priority.toLowerCase()}`}>
                                    {deadline.priority}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="insights-card">
                    <div className="card-header-flex">
                        <h3>Faculty Insights</h3>
                    </div>
                    {insights && insights.map(insight => (
                        <div key={insight.id}>
                            <p className="insight-text">{insight.text}</p>
                            <button className="insight-report-btn">View Full Report</button>
                        </div>
                    ))}
                </div>
            </div>

            <footer className="dashboard-footer">
                <div className="footer-left">
                    <div className="brand-small">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#3b82f6">
                            <path d="M12 2L1 7l11 5 11-5-11-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                        <span>University LMS v4.2</span>
                    </div>
                    <p>© 2024 University Portal Systems. All pedagogical rights reserved.</p>
                </div>
                <div className="footer-right">
                    <a href="#">Help Center</a>
                    <a href="#">Privacy Policy</a>
                    <a href="#">Contact Support</a>
                </div>
            </footer>
        </div>
    );
};

const StatCard = ({ label, value, change, subtitle, color, icon, progress }) => (
    <div className="f-stat-card">
        <div className="f-stat-header">
            <span className="f-stat-label">{label}</span>
            <span className={`f-stat-icon icon-${color}`}>{icon}</span>
        </div>
        <div className="f-stat-value">{value}</div>
        {change && <div className="f-stat-change up">↗ {change}</div>}
        {subtitle && <div className="f-stat-subtitle">{subtitle}</div>}
        {progress !== undefined && (
            <div className="stat-progress-container">
                <div className="stat-progress-bar">
                    <div className="stat-progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        )}
    </div>
);

const SectionCard = ({ section, onClick }) => (
    <div className="section-card">
        <img src={section.image_url} alt={section.course_name} className="section-image" />
        <span className="status-badge">{section.status}</span>
        <div className="section-content">
            <div className="section-type">{section.course_code} • {section.course_type}</div>
            <h3 className="section-title">{section.course_name} - Section {section.section_name}</h3>
            <div className="section-details">
                <div className="detail-item">👥 {section.enrolled_count} Enrolled</div>
                <div className="detail-item">🕒 {section.schedule}</div>
            </div>
            <div className="section-footer">
                <a href="#" className="syllabus-link" onClick={(e) => e.preventDefault()}>📄 Syllabus</a>
                <button className="view-analytics-btn" onClick={onClick}>View Analytics →</button>
            </div>
        </div>
    </div>
);

export default FacultyDashboard;
