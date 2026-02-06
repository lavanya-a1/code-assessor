import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI } from '../../services/api';
import './Dashboard.css';

function StudentDashboard() {
    const { user } = useAuth();
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

    // Mock data for features not yet in API
    const mockNotifications = [
        { type: 'competition', title: 'Weekly Contest #42', time: 'Starts in 3 hours' },
        { type: 'reminder', title: 'Daily Streak Warning', time: 'Complete a challenge to keep your streak' },
        { type: 'new', title: 'New Problem Set Released', time: 'Dynamic Programming 101' },
    ];

    const mockCourses = [
        { id: 1, name: 'Advanced Data Structures & Algorithms', instructor: 'Dr. Emily Chen', code: 'DSA-301' },
        { id: 2, name: 'Machine Learning Fundamentals', instructor: 'Prof. Michael Bay', code: 'ML-201' },
    ];

    useEffect(() => {
        if (user) {
            loadDashboardData();
        } else {
            setLoading(false);
        }
    }, [user]);

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

    return (
        <div className="dashboard">
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
                            {mockCourses.map((course) => (
                                <div key={course.id} className="course-card">
                                    <div className="course-icon">{course.code}</div>
                                    <div className="course-info">
                                        <div className="course-name">{course.name}</div>
                                        <div className="course-instructor">Instructor: {course.instructor}</div>
                                    </div>
                                </div>
                            ))}
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

                    {/* Notifications */}
                    <div className="dashboard-card">
                        <h3 className="notifications-title">UPCOMING NOTIFICATIONS</h3>
                        <div className="notifications-list">
                            {mockNotifications.map((notif, index) => (
                                <div key={index} className="notification-item">
                                    <span className={`notif-dot ${notif.type}`}></span>
                                    <div className="notif-content">
                                        <div className="notif-title">{notif.title}</div>
                                        <div className="notif-time">
                                            {notif.time} • <span className={`notif-tag ${notif.type}`}>{notif.type.toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentDashboard;
