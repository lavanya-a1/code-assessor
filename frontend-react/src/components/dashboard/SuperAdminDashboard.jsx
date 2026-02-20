import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { superAdminAPI } from '../../services/api';
import './SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
    const { logout, user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('overview'); // overview, colleges, programs, branches, users
    const [colleges, setColleges] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [branches, setBranches] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [modal, setModal] = useState(null); // college, program, branch, edit-user
    const [selectedUser, setSelectedUser] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, collegesRes, programsRes, branchesRes, usersRes] = await Promise.all([
                superAdminAPI.getStats(),
                superAdminAPI.getColleges(),
                superAdminAPI.getPrograms(),
                superAdminAPI.getBranches(),
                superAdminAPI.getUsers()
            ]);
            setStats(statsRes);
            setColleges(collegesRes);
            setPrograms(programsRes);
            setBranches(branchesRes);
            setUsersList(usersRes);
        } catch (err) {
            showToast('Failed to fetch data', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateCollege = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        try {
            await superAdminAPI.createCollege(data);
            showToast('College created successfully');
            setModal(null);
            fetchData();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleCreateProgram = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        data.duration_years = parseInt(data.duration_years);
        try {
            await superAdminAPI.createProgram(data);
            showToast('Program created successfully');
            setModal(null);
            fetchData();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleCreateBranch = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        data.college_id = parseInt(data.college_id);
        data.program_id = parseInt(data.program_id);
        try {
            await superAdminAPI.createBranch(data);
            showToast('Branch created successfully');
            setModal(null);
            fetchData();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        if (data.college_id) data.college_id = parseInt(data.college_id);
        data.is_active = data.is_active === 'true';

        try {
            await superAdminAPI.updateUser(selectedUser.id, data);
            showToast('User updated successfully');
            setModal(null);
            fetchData();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const renderOverview = () => (
        <div className="sa-overview">
            <div className="sa-stats-grid">
                <div className="sa-stat-card">
                    <div className="sa-stat-icon blue-bg">🏛️</div>
                    <div className="sa-stat-info">
                        <h3>Colleges</h3>
                        <p>{stats?.total_colleges || 0}</p>
                    </div>
                </div>
                <div className="sa-stat-card">
                    <div className="sa-stat-icon pink-bg">👥</div>
                    <div className="sa-stat-info">
                        <h3>Total Users</h3>
                        <p>{stats?.total_users || 0}</p>
                    </div>
                </div>
                <div className="sa-stat-card">
                    <div className="sa-stat-icon green-bg">💻</div>
                    <div className="sa-stat-info">
                        <h3>Problems</h3>
                        <p>{stats?.total_problems || 0}</p>
                    </div>
                </div>
                <div className="sa-stat-card">
                    <div className="sa-stat-icon amber-bg">📝</div>
                    <div className="sa-stat-info">
                        <h3>Submissions</h3>
                        <p>{stats?.total_submissions || 0}</p>
                    </div>
                </div>
            </div>

            <div className="sa-section">
                <div className="sa-section-header">
                    <h2>Recent Colleges</h2>
                    <button className="sa-btn sa-btn-primary sa-btn-sm" onClick={() => setActiveSection('colleges')}>View All</button>
                </div>
                <div className="sa-table-wrap">
                    <table className="sa-table">
                        <thead>
                            <tr>
                                <th>College Name</th>
                                <th>Short Name</th>
                                <th>Status</th>
                                <th>Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {colleges.slice(0, 5).map(c => (
                                <tr key={c.college_id}>
                                    <td>{c.college_name}</td>
                                    <td>{c.short_name}</td>
                                    <td>
                                        <span className={`sa-status-badge ${c.is_active ? 'sa-status-active' : 'sa-status-inactive'}`}>
                                            {c.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderColleges = () => (
        <div className="sa-section">
            <div className="sa-section-header">
                <h2>Manage Colleges</h2>
                <button className="sa-btn sa-btn-primary" onClick={() => setModal('college')}>+ Add College</button>
            </div>
            <div className="sa-table-wrap">
                <table className="sa-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Full Name</th>
                            <th>Short Code</th>
                            <th>Address</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {colleges.map(c => (
                            <tr key={c.college_id}>
                                <td>#{c.college_id}</td>
                                <td style={{ fontWeight: 600 }}>{c.college_name}</td>
                                <td><span className="sa-status-badge green-bg">{c.short_name}</span></td>
                                <td>{c.address || 'N/A'}</td>
                                <td>
                                    <span className={`sa-status-badge ${c.is_active ? 'sa-status-active' : 'sa-status-inactive'}`}>
                                        {c.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderPrograms = () => (
        <div className="sa-section">
            <div className="sa-section-header">
                <h2>Manage Programs</h2>
                <button className="sa-btn sa-btn-primary" onClick={() => setModal('program')}>+ Add Program</button>
            </div>
            <div className="sa-table-wrap">
                <table className="sa-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Program Name</th>
                            <th>Code</th>
                            <th>Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        {programs.map(p => (
                            <tr key={p.program_id}>
                                <td>#{p.program_id}</td>
                                <td style={{ fontWeight: 600 }}>{p.program_name}</td>
                                <td>{p.program_code}</td>
                                <td>{p.duration_years} Years</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderBranches = () => (
        <div className="sa-section">
            <div className="sa-section-header">
                <h2>Manage Branches</h2>
                <button className="sa-btn sa-btn-primary" onClick={() => setModal('branch')}>+ Add Branch</button>
            </div>
            <div className="sa-table-wrap">
                <table className="sa-table">
                    <thead>
                        <tr>
                            <th>Branch Name</th>
                            <th>Short Code</th>
                            <th>College</th>
                            <th>Program</th>
                        </tr>
                    </thead>
                    <tbody>
                        {branches.map(b => (
                            <tr key={b.branch_id}>
                                <td style={{ fontWeight: 600 }}>{b.branch_name}</td>
                                <td>{b.short_name}</td>
                                <td>{b.college?.short_name || 'N/A'}</td>
                                <td>{b.program?.program_name || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderUsers = () => (
        <div className="sa-section">
            <div className="sa-section-header">
                <h2>Global User Management</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--sa-text-light)' }}>
                    {usersList.length} total users across all colleges
                </p>
            </div>
            <div className="sa-table-wrap">
                <table className="sa-table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>College</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usersList.map(u => (
                            <tr key={u.id}>
                                <td style={{ fontWeight: 600 }}>{u.username}</td>
                                <td>{u.email}</td>
                                <td>
                                    <span className={`sa-status-badge ${u.role === 'super_admin' ? 'pink-bg' : u.role === 'admin' ? 'blue-bg' : 'amber-bg'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td>{colleges.find(c => c.college_id === u.college_id)?.short_name || 'Global'}</td>
                                <td>
                                    <span className={`sa-status-badge ${u.is_active ? 'sa-status-active' : 'sa-status-inactive'}`}>
                                        {u.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <button className="sa-btn sa-btn-primary sa-btn-sm" onClick={() => { setSelectedUser(u); setModal('edit-user'); }}>
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="sa-layout">
            <aside className="sa-sidebar">
                <div className="sa-brand">
                    <span>SUPER ADMIN</span>
                </div>
                <nav className="sa-nav">
                    <button className={`sa-nav-item ${activeSection === 'overview' ? 'active' : ''}`} onClick={() => setActiveSection('overview')}>
                        <span className="sa-nav-icon">📊</span>
                        <span>Overview</span>
                    </button>
                    <button className={`sa-nav-item ${activeSection === 'colleges' ? 'active' : ''}`} onClick={() => setActiveSection('colleges')}>
                        <span className="sa-nav-icon">🏛️</span>
                        <span>Colleges</span>
                    </button>
                    <button className={`sa-nav-item ${activeSection === 'programs' ? 'active' : ''}`} onClick={() => setActiveSection('programs')}>
                        <span className="sa-nav-icon">🎓</span>
                        <span>Programs</span>
                    </button>
                    <button className={`sa-nav-item ${activeSection === 'branches' ? 'active' : ''}`} onClick={() => setActiveSection('branches')}>
                        <span className="sa-nav-icon">🌿</span>
                        <span>Branches</span>
                    </button>
                    <button className={`sa-nav-item ${activeSection === 'users' ? 'active' : ''}`} onClick={() => setActiveSection('users')}>
                        <span className="sa-nav-icon">👥</span>
                        <span>Users</span>
                    </button>
                    <div style={{ marginTop: 'auto', padding: '1rem' }}>
                        <button className="sa-nav-item" onClick={logout} style={{ color: 'var(--sa-danger)' }}>
                            <span className="sa-nav-icon">🚪</span>
                            <span>Logout</span>
                        </button>
                    </div>
                </nav>
            </aside>

            <main className="sa-main">
                <header className="sa-header">
                    <div className="sa-header-title">
                        <h1>
                            {activeSection === 'overview' && 'System Overview'}
                            {activeSection === 'colleges' && 'College Management'}
                            {activeSection === 'programs' && 'Academic Programs'}
                            {activeSection === 'branches' && 'Branch Management'}
                            {activeSection === 'users' && 'User Access Control'}
                        </h1>
                    </div>
                    <div className="sa-user-menu">
                        <div className="sa-user-info" style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user?.username}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--sa-text-light)' }}>Super Admin</div>
                        </div>
                        <div className="sa-avatar">{user?.username?.[0].toUpperCase()}</div>
                    </div>
                </header>

                <div className="sa-content">
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                            <div className="sa-spinner">Loading...</div>
                        </div>
                    ) : (
                        <>
                            {activeSection === 'overview' && renderOverview()}
                            {activeSection === 'colleges' && renderColleges()}
                            {activeSection === 'programs' && renderPrograms()}
                            {activeSection === 'branches' && renderBranches()}
                            {activeSection === 'users' && renderUsers()}
                        </>
                    )}
                </div>
            </main>

            {/* Modals */}
            {modal === 'college' && (
                <div className="sa-modal-overlay">
                    <div className="sa-modal">
                        <button className="sa-modal-close" onClick={() => setModal(null)}>✕</button>
                        <h2>Add New College</h2>
                        <form onSubmit={handleCreateCollege}>
                            <div className="sa-form-group">
                                <label>College Name</label>
                                <input className="sa-input" name="college_name" required placeholder="e.g. Stanford University" />
                            </div>
                            <div className="sa-form-group">
                                <label>Short Name</label>
                                <input className="sa-input" name="short_name" required placeholder="e.g. STAN" />
                            </div>
                            <div className="sa-form-group">
                                <label>Address</label>
                                <textarea className="sa-input" name="address" rows="3"></textarea>
                            </div>
                            <button type="submit" className="sa-btn sa-btn-primary sa-btn-full" style={{ width: '100%' }}>Create College</button>
                        </form>
                    </div>
                </div>
            )}

            {modal === 'edit-user' && selectedUser && (
                <div className="sa-modal-overlay">
                    <div className="sa-modal">
                        <button className="sa-modal-close" onClick={() => setModal(null)}>✕</button>
                        <h2>Edit User: {selectedUser.username}</h2>
                        <form onSubmit={handleUpdateUser}>
                            <div className="sa-form-group">
                                <label>Role</label>
                                <select className="sa-input" name="role" defaultValue={selectedUser.role}>
                                    <option value="student">Student</option>
                                    <option value="faculty">Faculty</option>
                                    <option value="hod">HOD</option>
                                    <option value="principal">Principal</option>
                                    <option value="admin">College Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>
                            <div className="sa-form-group">
                                <label>Status</label>
                                <select className="sa-input" name="is_active" defaultValue={selectedUser.is_active ? 'true' : 'false'}>
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                            <div className="sa-form-group">
                                <label>Assign to College</label>
                                <select className="sa-input" name="college_id" defaultValue={selectedUser.college_id || ''}>
                                    <option value="">None / Global</option>
                                    {colleges.map(c => <option key={c.college_id} value={c.college_id}>{c.college_name}</option>)}
                                </select>
                            </div>
                            <button type="submit" className="sa-btn sa-btn-primary sa-btn-full" style={{ width: '100%' }}>Save Changes</button>
                        </form>
                    </div>
                </div>
            )}


            {modal === 'program' && (
                <div className="sa-modal-overlay">
                    <div className="sa-modal">
                        <button className="sa-modal-close" onClick={() => setModal(null)}>✕</button>
                        <h2>Add New Program</h2>
                        <form onSubmit={handleCreateProgram}>
                            <div className="sa-form-group">
                                <label>Program Name</label>
                                <input className="sa-input" name="program_name" required placeholder="e.g. B.Tech Computer Science" />
                            </div>
                            <div className="sa-form-group">
                                <label>Program Code</label>
                                <input className="sa-input" name="program_code" required placeholder="e.g. BTCS" />
                            </div>
                            <div className="sa-form-group">
                                <label>Duration (Years)</label>
                                <input className="sa-input" name="duration_years" type="number" defaultValue="4" required />
                            </div>
                            <button type="submit" className="sa-btn sa-btn-primary sa-btn-full" style={{ width: '100%' }}>Create Program</button>
                        </form>
                    </div>
                </div>
            )}

            {modal === 'branch' && (
                <div className="sa-modal-overlay">
                    <div className="sa-modal">
                        <button className="sa-modal-close" onClick={() => setModal(null)}>✕</button>
                        <h2>Add New Branch</h2>
                        <form onSubmit={handleCreateBranch}>
                            <div className="sa-form-group">
                                <label>Branch Name</label>
                                <input className="sa-input" name="branch_name" required placeholder="e.g. CSE" />
                            </div>
                            <div className="sa-form-group">
                                <label>Short Name</label>
                                <input className="sa-input" name="short_name" required placeholder="e.g. CSE" />
                            </div>
                            <div className="sa-form-group">
                                <label>College</label>
                                <select className="sa-input" name="college_id" required>
                                    <option value="">Select College</option>
                                    {colleges.map(c => <option key={c.college_id} value={c.college_id}>{c.college_name}</option>)}
                                </select>
                            </div>
                            <div className="sa-form-group">
                                <label>Program</label>
                                <select className="sa-input" name="program_id" required>
                                    <option value="">Select Program</option>
                                    {programs.map(p => <option key={p.program_id} value={p.program_id}>{p.program_name}</option>)}
                                </select>
                            </div>
                            <button type="submit" className="sa-btn sa-btn-primary sa-btn-full" style={{ width: '100%' }}>Create Branch</button>
                        </form>
                    </div>
                </div>
            )}

            {toast && (
                <div className="sa-toast">
                    <span>{toast.type === 'success' ? '✅' : '❌'}</span>
                    <span>{toast.msg}</span>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
