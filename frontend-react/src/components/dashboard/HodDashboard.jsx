import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import './Dashboard.css';
import './HodDashboard.css';

const HodDashboard = () => {
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

    if (loading) return <div className="dashboard-loading">Loading Dashboard...</div>;
    if (error) return <div className="dashboard-error">{error}</div>;

    return (
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
    );
};

export default HodDashboard;
