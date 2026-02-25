import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { dashboardAPI } from '../../services/api';
import './Dashboard.css';
import './HodDashboard.css';

const HodDashboard = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const [activeTab, setActiveTab] = useState('overview');
    const [assignments, setAssignments] = useState([]);
    const [myTeachings, setMyTeachings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Assignment Form State
    const [branchData, setBranchData] = useState({ courses: [], sections: [], faculty: [] });
    const [formData, setFormData] = useState({
        course_id: '',
        section_id: '',
        faculty_id: ''
    });
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignMessage, setAssignMessage] = useState({ type: '', text: '' });

    // Course Selection State
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedSection, setSelectedSection] = useState('');
    const [sectionStudents, setSectionStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (activeTab === 'assign') {
            fetchBranchData();
        }
        if (activeTab === 'overview') {
            fetchBranchData();
            setSelectedCourse(null);
            setSelectedSection('');
            setSectionStudents([]);
        }
    }, [activeTab]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const data = await dashboardAPI.getData();
            setAssignments(data.course_assignments || []);
            setMyTeachings(data.my_teachings || []);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch dashboard data');
            setLoading(false);
        }
    };

    const fetchBranchData = async () => {
        try {
            const data = await dashboardAPI.getHodBranchData();
            setBranchData(data);
        } catch (err) {
            console.error('Failed to fetch branch data', err);
        }
    };

    const fetchSectionStudents = async (sectionId) => {
        try {
            setStudentsLoading(true);
            const response = await dashboardAPI.getSectionStudents(sectionId);
            setSectionStudents(response.students || []);
            setStudentsLoading(false);
        } catch (err) {
            console.error('Failed to fetch students', err);
            setStudentsLoading(false);
        }
    };

    const handleCourseSelect = (course) => {
        setSelectedCourse(course);
        setSelectedSection('');
        setSectionStudents([]);
    };

    const handleSectionChange = (e) => {
        const sectionId = e.target.value;
        setSelectedSection(sectionId);
        if (sectionId) {
            fetchSectionStudents(sectionId);
        } else {
            setSectionStudents([]);
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        setAssignLoading(true);
        setAssignMessage({ type: '', text: '' });

        try {
            await dashboardAPI.assignFaculty({
                course_id: parseInt(formData.course_id),
                section_id: parseInt(formData.section_id),
                faculty_id: parseInt(formData.faculty_id)
            });

            setAssignMessage({ type: 'success', text: 'Faculty assigned successfully!' });
            setFormData({ course_id: '', section_id: '', faculty_id: '' });
            fetchDashboardData(); // Refresh overview
        } catch (err) {
            setAssignMessage({ type: 'error', text: err.message || 'Failed to assign faculty' });
        } finally {
            setAssignLoading(false);
        }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    if (loading) return (
        <div className="pd-loading-container">
            <div className="pd-spinner"></div>
            <p>Loading Dashboard...</p>
        </div>
    );
    if (error) return <div className="dashboard-error">{error}</div>;

    return (
        <div className="hod-layout">
            <header className="f-topbar">
                <div className="f-topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                    <div className="f-brand">
                        <div className="f-brand-icon"><span>&lt;&gt;</span></div>
                        <span className="f-brand-name">CodeLearn Pro</span>
                    </div>
                    
                    <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                        <button
                            style={{
                                background: 'none',
                                border: 'none',
                                color: activeTab === 'overview' ? 'var(--accent-blue)' : 'var(--text-muted)',
                                fontSize: '14px',
                                fontWeight: activeTab === 'overview' ? '600' : '500',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                transition: 'color 0.2s'
                            }}
                            onClick={() => setActiveTab('overview')}
                        >
                            Overview
                        </button>
                        <button
                            style={{
                                background: 'none',
                                border: 'none',
                                color: activeTab === 'assign' ? 'var(--accent-blue)' : 'var(--text-muted)',
                                fontSize: '14px',
                                fontWeight: activeTab === 'assign' ? '600' : '500',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                transition: 'color 0.2s'
                            }}
                            onClick={() => setActiveTab('assign')}
                        >
                            Assign Faculty
                        </button>
                        <button
                            style={{
                                background: 'none',
                                border: 'none',
                                color: activeTab === 'teachings' ? 'var(--accent-blue)' : 'var(--text-muted)',
                                fontSize: '14px',
                                fontWeight: activeTab === 'teachings' ? '600' : '500',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                transition: 'color 0.2s'
                            }}
                            onClick={() => setActiveTab('teachings')}
                        >
                            My Teachings
                        </button>
                    </nav>
                </div>

                <div className="f-topbar-right">
                    <button className="f-theme-toggle" onClick={toggleTheme} title="Toggle Theme">
                        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                    </button>

                    <div className="f-user-chip">
                        <div className="f-user-avatar">{(user?.username || 'H')[0].toUpperCase()}</div>
                        <div className="f-user-info">
                            <span className="f-user-name">{user?.username || 'HOD'}</span>
                            <span className="f-user-role">Head of Department</span>
                        </div>
                    </div>

                    <button className="f-header-logout" onClick={handleLogout} title="Logout">
                        <LogoutIcon />
                        <span>Logout</span>
                    </button>
                </div>
            </header>

            <div className="dashboard hod-dashboard">
                <div className="dashboard-content">
                    {activeTab === 'overview' && (
                        <div className="overview-section">
                            {!selectedCourse ? (
                                <>
                                    <div className="section-header">
                                        <h2>All Courses</h2>
                                        <p>Select a course to view sections and students</p>
                                    </div>
                                    <div className="courses-table-wrapper">
                                        {branchData.courses.length > 0 ? (
                                            <table className="courses-table">
                                                <thead>
                                                    <tr>
                                                        <th>Course Code</th>
                                                        <th>Course Name</th>
                                                        <th>Type</th>
                                                        <th>Credits</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {branchData.courses.map((course) => (
                                                        <tr key={course.id} className="course-row">
                                                            <td className="course-code-cell">{course.course_code}</td>
                                                            <td className="course-name-cell">{course.course_name}</td>
                                                            <td>
                                                                <span className={`course-type-badge ${course.course_type}`}>
                                                                    {course.course_type?.toUpperCase()}
                                                                </span>
                                                            </td>
                                                            <td>{course.credits}</td>
                                                            <td>
                                                                <button 
                                                                    className="view-btn"
                                                                    onClick={() => handleCourseSelect(course)}
                                                                >
                                                                    View Details
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="empty-state">
                                                <p>No courses found for your branch</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="section-header">
                                        <button className="back-btn" onClick={() => setSelectedCourse(null)}>
                                            ← Back to Courses
                                        </button>
                                        <div>
                                            <h2>{selectedCourse.course_name}</h2>
                                            <p className="course-detail">
                                                {selectedCourse.course_code} • 
                                                <span className={`type-inline ${selectedCourse.course_type}`}>
                                                    {selectedCourse.course_type?.toUpperCase()}
                                                </span> • 
                                                {selectedCourse.credits} Credits
                                            </p>
                                        </div>
                                    </div>

                                    <div className="section-selector">
                                        <label htmlFor="section-dropdown">Select Section:</label>
                                        <select 
                                            id="section-dropdown"
                                            value={selectedSection} 
                                            onChange={handleSectionChange}
                                            className="section-dropdown"
                                        >
                                            <option value="">Choose a section...</option>
                                            {branchData.sections
                                                .filter(s => s.course_id === selectedCourse.id)
                                                .map(section => (
                                                    <option key={section.section_id} value={section.section_id}>
                                                        {section.section_name}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                    </div>

                                    {selectedSection && (
                                        <div className="students-section">
                                            <h3>Students Enrolled</h3>
                                            {studentsLoading ? (
                                                <div className="loading-spinner">Loading students...</div>
                                            ) : sectionStudents.length > 0 ? (
                                                <div className="table-container">
                                                    <table className="students-table">
                                                        <thead>
                                                            <tr>
                                                                <th>ID</th>
                                                                <th>Username</th>
                                                                <th>Email</th>
                                                                <th>Phone</th>
                                                                <th>Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {sectionStudents.map((student) => (
                                                                <tr key={student.id}>
                                                                    <td>{student.id}</td>
                                                                    <td>{student.username}</td>
                                                                    <td>{student.email}</td>
                                                                    <td>{student.phone || 'N/A'}</td>
                                                                    <td>
                                                                        <span className={`status-badge ${student.is_active ? 'active' : 'inactive'}`}>
                                                                            {student.is_active ? 'Active' : 'Inactive'}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="empty-state">
                                                    <p>No students enrolled in this section</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'assign' && (
                        <div className="assign-section">
                            <div className="section-header">
                                <h2>Assign Faculty to Course</h2>
                                <p>Select a course, section, and faculty member to create an assignment</p>
                            </div>
                            <form className="assign-form" onSubmit={handleAssign}>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Course</label>
                                        <select
                                            value={formData.course_id}
                                            onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Course</option>
                                            {branchData.courses.map(c => (
                                                <option key={c.id} value={c.id}>{c.course_name} ({c.course_code})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Section</label>
                                        <select
                                            value={formData.section_id}
                                            onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Section</option>
                                            {branchData.sections.map(s => (
                                                <option key={s.section_id} value={s.section_id}>{s.section_name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Faculty</label>
                                        <select
                                            value={formData.faculty_id}
                                            onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Faculty</option>
                                            {branchData.faculty.map(f => (
                                                <option key={f.id} value={f.id}>{f.username}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {assignMessage.text && (
                                    <div className={`message ${assignMessage.type}`}>
                                        {assignMessage.text}
                                    </div>
                                )}

                                <button type="submit" className="submit-btn" disabled={assignLoading}>
                                    {assignLoading ? 'Assigning...' : 'Assign Faculty'}
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'teachings' && (
                        <div className="teachings-section">
                            <div className="section-header">
                                <h2>My Teaching Assignments</h2>
                                <p>Courses you are teaching as faculty</p>
                            </div>
                            <div className="table-container">
                                {myTeachings.length > 0 ? (
                                    <table className="hod-table">
                                        <thead>
                                            <tr>
                                                <th>Course Code</th>
                                                <th>Course Name</th>
                                                <th>Type</th>
                                                <th>Section</th>
                                                <th>Schedule</th>
                                                <th>Students</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myTeachings.map((teaching) => (
                                                <tr key={teaching.id}>
                                                    <td className="font-mono">{teaching.course_code}</td>
                                                    <td>{teaching.course_name}</td>
                                                    <td>
                                                        <span className={`type-badge ${teaching.course_type}`}>
                                                            {teaching.course_type?.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td>{teaching.section_name}</td>
                                                    <td className="schedule-cell">{teaching.schedule || 'Not set'}</td>
                                                    <td>
                                                        <span className="student-badge">{teaching.enrolled_count}</span>
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge ${teaching.status?.toLowerCase()}`}>
                                                            {teaching.status || 'ACTIVE'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="empty-state">
                                        <p>No teaching assignments found</p>
                                        <small>You are not currently assigned to teach any courses.</small>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

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

export default HodDashboard;
