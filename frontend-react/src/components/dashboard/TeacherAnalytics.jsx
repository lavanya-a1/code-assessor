import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import './TeacherAnalytics.css';

const TeacherAnalytics = ({ course, onBack }) => {
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                // We use course.section_id or course.id depending on what was passed
                const sectionId = course.section_id || course.sectionID || course.id;
                const data = await dashboardAPI.getSectionAnalytics(sectionId);
                setAnalytics(data);
            } catch (error) {
                console.error('Error fetching section analytics:', error);
            } finally {
                setLoading(false);
            }
        };
        if (course) {
            fetchAnalytics();
        }
    }, [course]);

    if (loading) return <div className="loading-container">
        <div className="loader"></div>
        <p>Loading Analytics...</p>
    </div>;

    if (!analytics) return <div className="error-container">
        <p>Failed to load analytics data.</p>
        <button onClick={onBack}>Back to Courses</button>
    </div>;

    const { topic_heatmap, progress_trends, student_performance } = analytics;


    return (
        <div className="teacher-analytics">
            <header className="analytics-header">
                <div className="breadcrumbs">
                    <span onClick={onBack} style={{ cursor: 'pointer' }}>MY COURSES</span>
                    <span className="breadcrumb-separator">›</span>
                    <span>{course.course_name} - SECTION {course.section_name}</span>
                </div>
                <div className="header-flex">
                    <div className="header-titles">
                        <h1>Teacher Analytics</h1>
                        <p>Section {course.section_name}: {course.course_name}</p>
                    </div>
                    <div className="header-actions">
                        <div className="date-selector">
                            <span>📅 Last 30 Days</span>
                            <span>▼</span>
                        </div>
                        <button className="download-report-btn">
                            <span>📥</span> Download Report
                        </button>
                    </div>
                </div>
            </header>

            <div className="analytics-grid">
                <div className="analytics-left">
                    <div className="analytics-card">
                        <div className="card-title-flex">
                            <h3><span>▦</span> Topic-wise Proficiency Heatmap</h3>
                            <div className="legend">
                                <div className="legend-item"><span className="dot high"></span> High</div>
                                <div className="legend-item"><span className="dot med"></span> Med</div>
                                <div className="legend-item"><span className="dot low"></span> Low</div>
                            </div>
                        </div>
                        <table className="heatmap-table">
                            <thead>
                                <tr>
                                    <th>TOPIC</th>
                                    <th>HIGH</th>
                                    <th>MED</th>
                                    <th>LOW</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topic_heatmap.map((t, i) => (
                                    <tr key={i}>
                                        <td className="topic-cell">{t.name}</td>
                                        <td className="value-cell"><span className="heatmap-badge badge-high">{t.high}</span></td>
                                        <td className="value-cell"><span className="heatmap-badge badge-med">{t.med}</span></td>
                                        <td className="value-cell"><span className="heatmap-badge badge-low">{t.low}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="analytics-card">
                        <div className="card-title-flex">
                            <h3><span>📈</span> Class Progress Trends</h3>
                            <div className="legend">
                                <div className="legend-item"><span className="dot completion"></span> COMPLETION</div>
                                <div className="legend-item"><span className="dot avg"></span> AVG</div>
                            </div>
                        </div>
                        <div className="chart-container">
                            {progress_trends.map((height, i) => (
                                <div key={i} className="chart-bar-group">
                                    <div
                                        className={`bar ${i > 4 && i < 15 ? 'highlight' : ''}`}
                                        style={{ height: `${height}px` }}
                                    ></div>
                                </div>
                            ))}
                        </div>
                        <div className="chart-labels">
                            <span>Day 1</span>
                            <span>Day 15</span>
                            <span>Today</span>
                        </div>
                    </div>
                </div>

                <div className="analytics-right">
                    <div className="analytics-card">
                        <div className="card-title-flex">
                            <h3><span>👥</span> Student Performance List</h3>
                            <a href="#" className="view-all-link" style={{ fontSize: '0.8rem', color: '#10b981', textDecoration: 'none', fontWeight: '700' }}>View All</a>
                        </div>
                        <div className="performance-list" style={{ marginTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.7rem', fontWeight: '800', color: '#64748b' }}>
                                <span>STUDENT ID</span>
                                <span>PROBLEMS</span>
                            </div>
                            {student_performance.map((s, i) => (
                                <div key={i} className="student-row">
                                    <div className="student-avatar-circle">{s.initials}</div>
                                    <div className="student-info">
                                        <div className="student-id">{s.id}</div>
                                        <div className="student-name">{s.name}</div>
                                    </div>
                                    <div className="solved-count">{s.count}</div>
                                </div>
                            ))}
                        </div>
                        <div className="list-footer">
                            <div className="pagination-controls">
                                <button className="pag-btn">‹</button>
                                <button className="pag-btn">›</button>
                            </div>
                            <span className="showing-text">SHOWING TOP {student_performance.length} STUDENTS</span>
                        </div>
                    </div>

                </div>
            </div>

            <div className="analytics-footer-msg">
                © 2024 CodeLearn Pro Analytics Engine. All data refreshed every 15 minutes.
            </div>
        </div>
    );
};

export default TeacherAnalytics;
