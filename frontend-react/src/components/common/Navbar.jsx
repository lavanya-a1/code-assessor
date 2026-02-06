import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../auth/AuthModal';

function Navbar() {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [authMode, setAuthMode] = useState(null);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <nav className="navbar">
                <div className="nav-container">
                    <div className="nav-left">
                        <Link to="/" className="nav-brand" style={{ textDecoration: 'none' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
                            </svg>
                            <h1>CodePlatform</h1>
                        </Link>
                        <Link
                            to="/dashboard"
                            className="btn-nav"
                            style={{
                                borderBottom: isActive('/dashboard') ? '2px solid #3b82f6' : 'none',
                                color: isActive('/dashboard') ? '#3b82f6' : undefined
                            }}
                        >
                            Dashboard
                        </Link>
                        <Link
                            to="/problems"
                            className="btn-nav"
                            style={{
                                borderBottom: isActive('/problems') ? '2px solid #3b82f6' : 'none',
                                color: isActive('/problems') ? '#3b82f6' : undefined
                            }}
                        >
                            Problems
                        </Link>
                        <Link to="#" className="btn-nav">Contests</Link>
                        <Link to="#" className="btn-nav">Discussions</Link>
                        {isAdmin() && (
                            <Link
                                to="/plagiarism"
                                className="btn-nav"
                                style={{
                                    borderBottom: isActive('/plagiarism') ? '2px solid #3b82f6' : 'none',
                                    color: isActive('/plagiarism') ? '#3b82f6' : undefined
                                }}
                            >
                                Plagiarism
                            </Link>
                        )}
                    </div>
                    <div className="nav-menu">
                        {/* Search */}
                        <div className="nav-search" style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '6px',
                            padding: '0.5rem 1rem',
                            marginRight: '1rem'
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                            <input
                                type="text"
                                placeholder="Search problems..."
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: 'var(--text-primary)',
                                    marginLeft: '0.5rem',
                                    width: '150px'
                                }}
                            />
                        </div>

                        {user ? (
                            <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {/* Streak Badge */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: 'var(--bg-tertiary)',
                                    padding: '0.4rem 0.75rem',
                                    borderRadius: '6px'
                                }}>
                                    <span>🔥</span>
                                    <span style={{ fontWeight: '600' }}>15</span>
                                </div>

                                {/* User Avatar */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: '500', fontSize: '14px' }}>{user.username}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pro Tier</div>
                                    </div>
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                                        borderRadius: '50%',
                                        cursor: 'pointer'
                                    }} onClick={handleLogout}></div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <button onClick={() => setAuthMode('login')} className="btn btn-secondary">Login</button>
                                <button onClick={() => setAuthMode('register')} className="btn btn-primary">Register</button>
                            </>
                        )}
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
