import { useState, useEffect } from 'react';
import { principalAPI } from '../../services/api';
import './PrincipalDashboard.css';

const PrincipalDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [potentialHods, setPotentialHods] = useState([]);
    const [assigning, setAssigning] = useState(false);
    const [selectedFaculty, setSelectedFaculty] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

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

    const openAssignModal = async (branch) => {
        setSelectedBranch(branch);
        setModalOpen(true);
        try {
            const res = await principalAPI.getBranches();
            setPotentialHods(res.faculty || []);
        } catch (err) {
            console.error('Failed to fetch potential HODs', err);
        }
    };

    const handleAssignHod = async () => {
        if (!selectedFaculty || !selectedBranch) return;

        try {
            setAssigning(true);
            await principalAPI.assignHod({
                branch_id: selectedBranch.branch_id,
                user_id: parseInt(selectedFaculty)
            });
            setModalOpen(false);
            fetchDashboardData();
            setSelectedFaculty('');
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
        <div className="pd-container">
            <header className="pd-header">
                <div className="pd-header-title">
                    <h1>College Analytics</h1>
                    <p>Strategic overview of academic departments and enrollment</p>
                </div>
                <div className="pd-header-date">
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
            </header>

            <div className="pd-stats-grid">
                <div className="pd-stat-card">
                    <div className="pd-stat-icon blue">🏗️</div>
                    <div className="pd-stat-info">
                        <h3>Departments</h3>
                        <p>{stats.total_branches}</p>
                    </div>
                </div>
                <div className="pd-stat-card">
                    <div className="pd-stat-icon sky">📚</div>
                    <div className="pd-stat-info">
                        <h3>Total Courses</h3>
                        <p>{stats.total_courses}</p>
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

            <section className="pd-branches-section">
                <div className="pd-section-header">
                    <h2>Branch Performance & Leadership</h2>
                </div>

                <div className="pd-branch-grid">
                    {branch_analytics.map((branch) => (
                        <div key={branch.branch_id} className="pd-branch-card">
                            <div className="pd-branch-header">
                                <h3>{branch.branch_name}</h3>
                                <div className="pd-branch-badge">Active</div>
                            </div>
                            <div className="pd-branch-body">
                                <div className="pd-branch-stats">
                                    <div className="pd-bstat-item">
                                        <span className="pd-bstat-value">{branch.course_count}</span>
                                        <span className="pd-bstat-label">Courses</span>
                                    </div>
                                    <div className="pd-bstat-item">
                                        <span className="pd-bstat-value">{branch.faculty_count}</span>
                                        <span className="pd-bstat-label">Faculty</span>
                                    </div>
                                    <div className="pd-bstat-item">
                                        <span className="pd-bstat-value">{branch.student_count}</span>
                                        <span className="pd-bstat-label">Students</span>
                                    </div>
                                </div>
                                <div className="pd-hod-info">
                                    <div className="pd-hod-details">
                                        <dt>Head of Department</dt>
                                        <dd>{branch.hod_name}</dd>
                                    </div>
                                    <button
                                        className="pd-btn-assign"
                                        onClick={() => openAssignModal(branch)}
                                    >
                                        {branch.hod_name === 'Not Assigned' ? 'Assign HOD' : 'Change HOD'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {modalOpen && (
                <div className="pd-modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="pd-modal" onClick={e => e.stopPropagation()}>
                        <h2 className="pd-modal-title">Assign Branch Leadership</h2>
                        <p className="pd-modal-subtitle">Select a faculty member for {selectedBranch?.branch_name}</p>

                        <div className="pd-form-group">
                            <label>Faculty Member</label>
                            <select
                                className="pd-form-control"
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

                        <div className="pd-modal-actions">
                            <button
                                className="pd-btn pd-btn-secondary"
                                onClick={() => setModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="pd-btn pd-btn-primary"
                                onClick={handleAssignHod}
                                disabled={assigning || !selectedFaculty}
                            >
                                {assigning ? 'Assigning...' : 'Confirm Assignment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrincipalDashboard;
