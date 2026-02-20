import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'student'
    });
    const [error, setError] = useState('');
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await login(formData.username, formData.password);
            } else {
                await register(formData.username, formData.email, formData.password, formData.role);
                await login(formData.username, formData.password);
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Authentication failed');
        }
    };

    return (
        <div className="login-page">
            <div className="login-left">
                <div className="brand-header">
                    <div className="brand-logo">&lt; &gt;</div>
                    <h1>CodeLearn Pro</h1>
                </div>
                <div className="hero-content">
                    <h2>Empower your coding journey with real-time analytics.</h2>
                    <p>Access specialized dashboards for students and faculty members. Track progress, manage assignments, and master your crafts.</p>
                </div>
                <div className="illustration-box">
                    <div className="code-card">
                        <div className="code-header">
                            <span className="dot red"></span>
                            <span className="dot yellow"></span>
                            <span className="dot green"></span>
                        </div>
                        <pre>
                            <code>
                                {`async function analyzeEngagement(sectionId) {
  const data = await db.fetch(sectionId);
  return data.map(s => ({
    id: s.id,
    score: (s.solved / s.total) * 100
  }));
}`}
                            </code>
                        </pre>
                    </div>
                </div>
            </div>

            <div className="login-right">
                <div className="auth-container">
                    <div className="auth-header">
                        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                        <p>{isLogin ? 'Enter your credentials to access your portal' : 'Join our learning community today'}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="input-group">
                            <label>Username</label>
                            <input
                                type="text"
                                name="username"
                                placeholder="john_doe"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {!isLogin && (
                            <div className="input-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        )}

                        <div className="input-group">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {!isLogin && (
                            <div className="input-group">
                                <label>I am a</label>
                                <select name="role" value={formData.role} onChange={handleChange}>
                                    <option value="student">Student</option>
                                    <option value="faculty">Faculty Member</option>
                                    <option value="principal">Principal</option>
                                </select>
                            </div>
                        )}

                        {error && <div className="auth-error">{error}</div>}

                        <button type="submit" className="submit-btn">
                            {isLogin ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <span
                                className="toggle-auth"
                                onClick={() => setIsLogin(!isLogin)}
                            >
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
