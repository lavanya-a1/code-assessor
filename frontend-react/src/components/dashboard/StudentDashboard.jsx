import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { dashboardAPI } from '../../services/api';
import './Dashboard.css';

function StudentDashboard({ isAnalyticsView = false, sectionId = null }) {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [leaderboardTab, setLeaderboardTab] = useState('global');

    const [stats, setStats] = useState({
        totalSolved: 0,
        totalProblems: 0,
        currentStreak: 0,
        accuracy: 0,
        accuracyChange: 0,
        collegeRank: 1,
        totalPoints: 0,
    });

    const [topics, setTopics] = useState([]);
    const [activity, setActivity] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [userRank, setUserRank] = useState(0);
    const [enrolledCourses, setEnrolledCourses] = useState([]);

    useEffect(() => {
        if (user || isAnalyticsView) {
            loadDashboardData();
        } else {
            setLoading(false);
        }
    }, [user, isAnalyticsView, sectionId]);

    const loadDashboardData = async () => {
        try {
            const data = await dashboardAPI.getData();

            // Update stats
            setStats({
                totalSolved: data.stats?.total_solved || 0,
                totalProblems: data.stats?.total_problems || 0,
                currentStreak: data.stats?.current_streak || 0,
                accuracy: data.stats?.accuracy || 0,
                accuracyChange: data.stats?.accuracy_change || 0,
                collegeRank: data.stats?.college_rank || 1,
                totalPoints: data.stats?.total_points || 0,
            });

            // Update topics
            setTopics(data.topic_proficiency || []);

            // Update activity
            setActivity(data.activity || []);

            // Update leaderboard
            setLeaderboard(data.leaderboard || []);
            setUserRank(data.current_user_rank || 0);

            // Update courses
            setEnrolledCourses(data.enrolled_courses || []);

        } catch (err) {
            console.error('Failed to load dashboard:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };


    const getActivityColor = (count) => {
        if (count === 0) return 'var(--activity-0)';
        if (count === 1) return 'var(--activity-1)';
        if (count === 2) return 'var(--activity-2)';
        if (count === 3) return 'var(--activity-3)';
        return 'var(--activity-4)';
    };

    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    if (!user) {
        return (
            <div className="dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <h2>Welcome to CodePlatform</h2>
                    <p className="text-muted">Please login to view your dashboard</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className="dashboard"><p className="text-muted">Loading dashboard...</p></div>;
    }

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <div className="student-layout">
            {!isAnalyticsView && (
                <header className="f-topbar">
                    <div className="f-topbar-left">
                        <div className="f-brand">
                            <div className="f-brand-icon"><span>&lt;&gt;</span></div>
                            <span className="f-brand-name">CodeLearn Pro</span>
                        </div>
                    </div>

                    <div className="f-topbar-right">
                        <button className="f-theme-toggle" onClick={toggleTheme} title="Toggle Theme">
                            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                        </button>

                        <div className="f-user-chip">
                            <div className="f-user-avatar">{(user?.username || 'S')[0].toUpperCase()}</div>
                            <div className="f-user-info">
                                <span className="f-user-name">{user?.username || 'Student'}</span>
                                <span className="f-user-role">Student</span>
                            </div>
                        </div>

                        <button className="f-header-logout" onClick={handleLogout} title="Logout">
                            <LogoutIcon />
                            <span>Logout</span>
                        </button>
                    </div>
                </header>
            )}

            <div className={`dashboard ${isAnalyticsView ? 'analytics-view' : ''}`}>
                {error && <div style={{ color: 'var(--accent-red)', marginBottom: '1rem' }}>{error}</div>}

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-label">TOTAL SOLVED</span>
                            <span className="stat-icon check">✓</span>
                        </div>
                        <div className="stat-value">
                            {stats.totalSolved} <span className="stat-total">/ {stats.totalProblems}</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-label">CURRENT STREAK</span>
                            <span className="stat-icon bolt">⚡</span>
                        </div>
                        <div className="stat-value">{stats.currentStreak} Days</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-label">ACCURACY</span>
                            <span className="stat-icon chart">📊</span>
                        </div>
                        <div className="stat-value">{stats.accuracy.toFixed(1)}%</div>
                        <div className="stat-change positive">↗ +{stats.accuracyChange.toFixed(1)}% from last week</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-label">COLLEGE RANK</span>
                            <span className="stat-icon trophy">🏆</span>
                        </div>
                        <div className="stat-value">#{stats.collegeRank}</div>
                        <div className="stat-subtitle">{stats.totalPoints} points</div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="dashboard-grid">
                    {/* Left Column */}
                    <div className="dashboard-left">
                        {/* Topic Proficiency */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <h3>Topic Proficiency</h3>
                                <button className="view-all-btn">VIEW ALL TOPICS</button>
                            </div>
                            <div className="topics-list">
                                {topics.length === 0 ? (
                                    <p className="text-muted">No topics available yet. Solve problems to see your progress!</p>
                                ) : (
                                    topics.map((topic, index) => (
                                        <div key={index} className="topic-item">
                                            <div className="topic-name">{topic.name}</div>
                                            <div className="topic-progress">
                                                <div className="progress-bar">
                                                    <div className="progress-fill" style={{ width: `${topic.progress}%` }}></div>
                                                </div>
                                                <span className="progress-percent">{topic.progress}%</span>
                                            </div>
                                            <div className="topic-stats">
                                                <span className="easy">{topic.easy} EASY</span>
                                                <span className="medium">{topic.medium} MED</span>
                                                <span className="hard">{topic.hard} HARD</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Submission Activity */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <h3>Submission Activity</h3>
                                <div className="activity-legend">
                                    <span>LESS</span>
                                    <div className="legend-squares">
                                        <div className="legend-square" style={{ background: 'var(--activity-0)' }}></div>
                                        <div className="legend-square" style={{ background: 'var(--activity-1)' }}></div>
                                        <div className="legend-square" style={{ background: 'var(--activity-2)' }}></div>
                                        <div className="legend-square" style={{ background: 'var(--activity-3)' }}></div>
                                        <div className="legend-square" style={{ background: 'var(--activity-4)' }}></div>
                                    </div>
                                    <span>MORE</span>
                                </div>
                            </div>
                            <div className="activity-subtitle">{activity.reduce((sum, d) => sum + d.count, 0)} submissions in the last year</div>
                            <div className="activity-heatmap">
                                <div className="heatmap-grid">
                                    {activity.map((day, index) => (
                                        <div
                                            key={index}
                                            className="heatmap-cell"
                                            style={{ background: getActivityColor(day.count) }}
                                            title={`${day.date}: ${day.count} submissions`}
                                        ></div>
                                    ))}
                                </div>
                                <div className="heatmap-months">
                                    {months.map((month) => (
                                        <span key={month}>{month}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Current Enrolled Courses */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <h3>Current Enrolled Courses</h3>
                                <button className="view-all-btn">VIEW ALL COURSES</button>
                            </div>
                            <div className="courses-grid">
                                {enrolledCourses.length === 0 ? (
                                    <p className="text-muted">No courses enrolled yet.</p>
                                ) : (
                                    enrolledCourses.map((course) => (
                                        <div key={course.id} className="course-card">
                                            <div className="course-icon">{course.code}</div>
                                            <div className="course-info">
                                                <div className="course-name">{course.name}</div>
                                                <div className="course-instructor">Instructor: {course.instructor}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="dashboard-right">
                        {/* Leaderboard */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <h3>Leaderboard</h3>
                                <div className="leaderboard-tabs">
                                    <button
                                        className={leaderboardTab === 'global' ? 'active' : ''}
                                        onClick={() => setLeaderboardTab('global')}
                                    >
                                        Global
                                    </button>
                                    <button
                                        className={leaderboardTab === 'college' ? 'active' : ''}
                                        onClick={() => setLeaderboardTab('college')}
                                    >
                                        College
                                    </button>
                                </div>
                            </div>
                            <div className="leaderboard-list">
                                {leaderboard.length === 0 ? (
                                    <p className="text-muted">No leaderboard data yet</p>
                                ) : (
                                    leaderboard.slice(0, 5).map((entry) => (
                                        <div key={entry.rank} className={`leaderboard-item ${entry.user_id === user?.id ? 'current-user' : ''}`}>
                                            <span className="lb-rank">{entry.rank}</span>
                                            <div className="lb-avatar"></div>
                                            <div className="lb-info">
                                                <div className="lb-name">{entry.name}</div>
                                                <div className="lb-stats">{entry.solved} Solved • {(entry.points / 1000).toFixed(1)}k points</div>
                                            </div>
                                            {entry.rank === 1 && <span className="lb-badge gold">🏆</span>}
                                        </div>
                                    ))
                                )}

                                {userRank > 5 && (
                                    <>
                                        <div className="leaderboard-divider">⋮</div>
                                        <div className="leaderboard-item current-user">
                                            <span className="lb-rank">{userRank}</span>
                                            <div className="lb-avatar you"></div>
                                            <div className="lb-info">
                                                <div className="lb-name">{user?.username} (You)</div>
                                                <div className="lb-stats">{stats.totalSolved} Solved • {stats.totalPoints} points</div>
                                            </div>
                                            <span className="lb-badge top">TOP 1%</span>
                                        </div>
                                    </>
                                )}
                            </div>
                            <button className="view-full-btn">VIEW FULL LEADERBOARD</button>
                        </div>

                        {/* Notifications (Only show if any exist) */}
                        <div className="dashboard-card">
                            <h3 className="notifications-title">UPCOMING NOTIFICATIONS</h3>
                            <div className="notifications-list">
                                <p className="text-muted">No new notifications.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

/* --- Icons --- */
const SunIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);
const MoonIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);
const LogoutIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

export default StudentDashboard;
