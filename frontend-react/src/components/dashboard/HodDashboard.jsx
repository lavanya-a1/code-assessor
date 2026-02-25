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

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (activeTab === 'assign') {
            fetchBranchData();
        }
    }, [activeTab]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const data = await dashboardAPI.getData();
            setAssignments(data.course_assignments || []);
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
                <header className="dashboard-header">
                    <div className="header-left">
                        <h1>HOD Dashboard</h1>
                        <p className="subtitle">Manage courses and faculty assignments for your branch</p>
                    </div>
                </header>

                <div className="dashboard-tabs">
                    <button
                        className={activeTab === 'overview' ? 'active' : ''}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={activeTab === 'assign' ? 'active' : ''}
                        onClick={() => setActiveTab('assign')}
                    >
                        Assign Faculty
                    </button>
                </div>

                <div className="dashboard-content">
                    {activeTab === 'overview' ? (
                        <div className="dashboard-card overview-card">
                            <div className="card-header">
                                <h3>Course Assignments</h3>
                            </div>
                            <div className="table-container">
                                <table className="hod-table">
                                    <thead>
                                        <tr>
                                            <th>Course Code</th>
                                            <th>Course Name</th>
                                            <th>Section</th>
                                            <th>Assigned Faculty</th>
                                            <th>Students</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assignments.length > 0 ? (
                                            assignments.map((a) => (
                                                <tr key={a.id}>
                                                    <td className="font-mono">{a.course_code}</td>
                                                    <td>{a.course_name}</td>
                                                    <td>{a.section_name}</td>
                                                    <td className="faculty-cell">
                                                        <div className="faculty-avatar">{a.faculty_name.charAt(0)}</div>
                                                        {a.faculty_name}
                                                    </td>
                                                    <td>
                                                        <span className="student-badge">{a.student_count}</span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center empty-cell">No assignments found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="dashboard-card assign-card">
                            <div className="card-header">
                                <h3>Assign Faculty to Course</h3>
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
