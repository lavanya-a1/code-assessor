import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import AuthModal from '../auth/AuthModal';

function Navbar() {
    const { user, logout, isAdmin } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [authMode, setAuthMode] = useState(null);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    if (user?.role === 'admin') return null;

    return (
        <>
            <nav className="navbar">
                <div className="nav-container">
                    <div className="nav-left">
                        <Link to="/" className="nav-brand" style={{ textDecoration: 'none' }}>
                            <div className="brand-icon" style={{ background: '#10b981', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 'bold', fontSize: '1rem' }}>
                                &lt;&gt;
                            </div>
                            <h1 style={{ color: 'white', fontSize: '1.2rem', fontWeight: '700' }}>CodeLearn Pro</h1>
                        </Link>

                        <div className="nav-search-container">
                            <div className="nav-search">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search students, topics..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="nav-right">
                        <div className="nav-links">
                            <Link
                                to="/dashboard"
                                className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                            >
                                Dashboard
                            </Link>
                            <Link to="#" className="nav-link">Analytics</Link>
                            <Link to="#" className="nav-link">Courses</Link>
                            <Link to="#" className="nav-link">Reports</Link>
                        </div>

                        <div className="nav-actions">
                            <button className="action-btn" onClick={toggleTheme} title="Toggle Theme">
                                {theme === 'dark' ? '☀️' : '🌙'}
                            </button>
                            <button className="action-btn notification">
                                🔔
                                <span className="notif-dot-active"></span>
                            </button>

                            {user && (
                                <div className="user-profile">
                                    <div className="user-text">
                                        <div className="user-name" onClick={handleLogout} style={{ cursor: 'pointer' }}>
                                            {user.username === 'faculty1' ? 'Dr. Sarah Jenkins' : user.username}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {authMode && (
                <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onSwitch={setAuthMode} />
            )}
        </>
    );
}

export default Navbar;
