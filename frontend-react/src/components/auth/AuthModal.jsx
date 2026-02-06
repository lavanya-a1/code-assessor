import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';

function AuthModal({ mode, onClose, onSwitch }) {
    const { login, register } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'login') {
                await login(formData.username, formData.password);
            } else {
                await register(formData.username, formData.email, formData.password);
                // After registration, log them in
                await login(formData.username, formData.password);
            }
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <Modal onClose={onClose}>
            <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        minLength={3}
                        maxLength={50}
                    />
                </div>

                {mode === 'register' && (
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                    />
                </div>

                {error && <p style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</p>}

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                    {loading ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Register')}
                </button>
            </form>

            <p className="auth-switch" style={{ marginTop: '1rem', textAlign: 'center' }}>
                {mode === 'login' ? (
                    <>Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); onSwitch('register'); }}>Register</a></>
                ) : (
                    <>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); onSwitch('login'); }}>Login</a></>
                )}
            </p>
        </Modal>
    );
}

export default AuthModal;
