import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { principalAPI, adminAPI } from '../../services/api';
import './PrincipalDashboard.css';

/* --- Icons --- */
const GridIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
);
const BookIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
);
const FileIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
);
const UserPlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
    </svg>
);
const ChevronRightIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);
const ChevronLeftIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);
const LogoutIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);
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

const PrincipalDashboard = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [potentialHods, setPotentialHods] = useState([]);
    const [assigning, setAssigning] = useState(false);
    const [selectedFaculty, setSelectedFaculty] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeSection, setActiveSection] = useState('analytics');
    const [courses, setCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (activeSection === 'courses' && courses.length === 0) {
            fetchCourses();
        }
        if (activeSection === 'assign-hod' && potentialHods.length === 0) {
            fetchPotentialHods();
        }
    }, [activeSection]);

    const fetchCourses = async () => {
        try {
            setCoursesLoading(true);
            const res = await adminAPI.getCourses();
            setCourses(res || []);
        } catch (err) {
            console.error('Failed to fetch courses', err);
        } finally {
            setCoursesLoading(false);
        }
    };

    const fetchPotentialHods = async () => {
        try {
            const res = await principalAPI.getBranches();
            setPotentialHods(res.faculty || []);
        } catch (err) {
            console.error('Failed to fetch potential HODs', err);
        }
    };

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const res = await principalAPI.getDashboard();
            setData(res);
            setError(null);
        } catch (err) {
            setError('Failed to fetch dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const handleAssignHod = async () => {
        if (!selectedFaculty || !selectedBranch) return;

        try {
            setAssigning(true);
            await principalAPI.assignHod({
                branch_id: selectedBranch.branch_id,
                user_id: parseInt(selectedFaculty)
            });
            fetchDashboardData();
            setSelectedFaculty('');
            // Optional: alert('HOD Assigned Successfully');
        } catch (err) {
            alert(err.message || 'Failed to assign HOD');
        } finally {
            setAssigning(false);
        }
    };

    if (loading) {
        return (
            <div className="pd-loading-container">
                <div className="pd-spinner"></div>
                <p>Analyzing College Data...</p>
            </div>
        );
    }

    if (error) {
        return <div className="pd-container"><div className="error-box">{error}</div></div>;
    }

    const { stats, branch_analytics } = data;

    return (
        <div className={`pd-layout ${sidebarOpen ? '' : 'pd-sidebar-collapsed'}`}>
            {/* Sidebar */}
            <aside className="pd-sidebar">
                <div className="pd-sidebar-brand">
                    <div className="pd-brand-icon"><span>&lt;/&gt;</span></div>
                    {sidebarOpen && <span className="pd-brand-name">Principal Panel</span>}
                </div>

                <nav className="pd-sidebar-nav">
                    {[
                        { id: 'analytics', icon: <GridIcon />, label: 'Analytics' },
                        { id: 'courses', icon: <BookIcon />, label: 'Courses' },
                        { id: 'assign-hod', icon: <UserPlusIcon />, label: 'Assign HOD' },
                        { id: 'reports', icon: <FileIcon />, label: 'Reports' },
                    ].map(item => (
                        <button
                            key={item.id}
                            className={`pd-nav-item ${activeSection === item.id ? 'pd-active' : ''}`}
                            onClick={() => setActiveSection(item.id)}
                            title={item.label}
                        >
                            <span className="pd-nav-icon">{item.icon}</span>
                            {sidebarOpen && <span className="pd-nav-label">{item.label}</span>}
                        </button>
                    ))}
                </nav>

                <button className="pd-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle sidebar">
                    {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </button>
            </aside>

            {/* Main Content */}
            <main className="pd-main-wrap">
                {/* Topbar */}
                <header className="pd-topbar">
                    <div className="pd-topbar-left">
                        <h1>
                            {activeSection === 'analytics' && 'College Analytics'}
                            {activeSection === 'courses' && 'Institutional Courses'}
                            {activeSection === 'assign-hod' && 'Leadership Assignment'}
                            {activeSection === 'reports' && 'Strategic Reports'}
                        </h1>
                    </div>

                    <div className="pd-topbar-right">
                        {/* Theme Toggle */}
                        <button className="pd-theme-toggle" onClick={toggleTheme} title="Toggle Theme">
                            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                        </button>

                        <div className="pd-user-chip">
                            <div className="pd-user-avatar">{(user?.username || 'P')[0].toUpperCase()}</div>
                            <div className="pd-user-info">
                                <span className="pd-user-name">{user?.username || 'Principal'}</span>
                                <span className="pd-user-role">College Principal</span>
                            </div>
                        </div>

                        <button className="pd-header-logout" onClick={handleLogout} title="Logout">
                            <LogoutIcon />
                            <span>Logout</span>
                        </button>
                    </div>
                </header>

                <div className="pd-content-area">
                    {activeSection === 'analytics' && (
                        <>
                            <div className="pd-stats-grid">
                                <div className="pd-stat-card">
                                    <div className="pd-stat-icon blue">🏗️</div>
                                    <div className="pd-stat-info">
                                        <h3>Departments</h3>
                                        <p>{stats.total_branches}</p>
                                    </div>
                                </div>
                                <div className="pd-stat-card">
                                    <div className="pd-stat-icon violet">👨‍🏫</div>
                                    <div className="pd-stat-info">
                                        <h3>Total Faculty</h3>
                                        <p>{stats.total_faculty}</p>
                                    </div>
                                </div>
                                <div className="pd-stat-card">
                                    <div className="pd-stat-icon amber">🎓</div>
                                    <div className="pd-stat-info">
                                        <h3>Enrolled Students</h3>
                                        <p>{stats.total_students}</p>
                                    </div>
                                </div>
                            </div>

                            <section className="pd-branches-summary">
                                <div className="pd-section-header">
                                    <h2>Department Overviews</h2>
                                </div>
                                <div className="pd-branch-grid">
                                    {branch_analytics.map((branch) => (
                                        <div key={branch.branch_id} className="pd-branch-card pd-card-compact">
                                            <div className="pd-branch-header">
                                                <h3>{branch.branch_name}</h3>
                                                <div className="pd-branch-badge">{branch.student_count} Students</div>
                                            </div>
                                            <div className="pd-branch-body">
                                                <div className="pd-hod-brief">
                                                    <span className="pd-label">HOD:</span>
                                                    <span className="pd-value">{branch.hod_name}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}

                    {activeSection === 'courses' && (
                        <div className="pd-courses-view">
                            <div className="pd-section-header">
                                <div className="pd-header-text">
                                    <h2>Institutional Course Repository</h2>
                                    <p>Centralized view of all academic programs and departments.</p>
                                </div>
                            </div>
                            {coursesLoading ? (
                                <div className="pd-inline-loading"><div className="pd-spinner"></div></div>
                            ) : (
                                <div className="pd-table-wrapper">
                                    <table className="pd-table">
                                        <thead>
                                            <tr>
                                                <th>Code</th>
                                                <th>Name</th>
                                                <th>Type</th>
                                                <th>Credits</th>
                                                <th>Semester</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {courses.map(c => (
                                                <tr key={c.id}>
                                                    <td><code>{c.course_code}</code></td>
                                                    <td className="pd-font-medium">{c.course_name}</td>
                                                    <td><span className={`pd-type-badge ${c.course_type}`}>{c.course_type}</span></td>
                                                    <td>{c.credits}</td>
                                                    <td>Sem {c.semester_id}</td>
                                                </tr>
                                            ))}
                                            {courses.length === 0 && (
                                                <tr><td colSpan="5" className="pd-empty">No courses found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeSection === 'assign-hod' && (
                        <div className="pd-assignment-view">
                            <div className="pd-assignment-container">
                                <div className="pd-assignment-form-card">
                                    <div className="pd-card-header">
                                        <div className="pd-icon-box gold"><UserPlusIcon /></div>
                                        <div className="pd-text">
                                            <h3>Assign Branch Head</h3>
                                            <p>Select a branch and a faculty member to authorize as HOD.</p>
                                        </div>
                                    </div>

                                    <div className="pd-form-grid">
                                        <div className="pd-form-group">
                                            <label>Academic Branch</label>
                                            <select
                                                className="pd-select"
                                                value={selectedBranch?.branch_id || ''}
                                                onChange={(e) => {
                                                    const b = branch_analytics.find(ba => ba.branch_id === parseInt(e.target.value));
                                                    setSelectedBranch(b);
                                                }}
                                            >
                                                <option value="">Select Department...</option>
                                                {branch_analytics.map(b => (
                                                    <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="pd-form-group">
                                            <label>Faculty Member</label>
                                            <select
                                                className="pd-select"
                                                value={selectedFaculty}
                                                onChange={(e) => setSelectedFaculty(e.target.value)}
                                            >
                                                <option value="">Select Faculty...</option>
                                                {potentialHods.map(faculty => (
                                                    <option key={faculty.id} value={faculty.id}>
                                                        {faculty.username} ({faculty.email})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        className="pd-btn-primary pd-btn-full"
                                        onClick={handleAssignHod}
                                        disabled={assigning || !selectedFaculty || !selectedBranch}
                                    >
                                        {assigning ? <><div className="pd-spinner-sm"></div> Assigning...</> : 'Confirm Leadership Assignment'}
                                    </button>
                                </div>

                                <div className="pd-assignment-status-card">
                                    <div className="pd-section-header-sm">
                                        <h4>Current Branch Leadership</h4>
                                    </div>
                                    <div className="pd-leadership-list">
                                        {branch_analytics.map(b => (
                                            <div key={b.branch_id} className="pd-leader-item">
                                                <div className="pd-branch-info">
                                                    <span className="pd-b-name">{b.branch_name}</span>
                                                </div>
                                                <div className="pd-leader-info">
                                                    <span className={`pd-h-name ${b.hod_name === 'Not Assigned' ? 'pd-unassigned' : ''}`}>
                                                        {b.hod_name}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'reports' && (
                        <div className="pd-placeholder-view">
                            <div className="pd-placeholder-content">
                                <div className="pd-placeholder-icon">
                                    <FileIcon />
                                </div>
                                <h2>Strategic Institutional Reports</h2>
                                <p>We are currently aggregating data for the strategic module. Please check back shortly for full institutional reports.</p>
                                <div className="pd-spinner"></div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PrincipalDashboard;
