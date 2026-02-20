import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(authAPI.getCurrentUser());
    const [loading, setLoading] = useState(false);

    const login = async (username, password) => {
        setLoading(true);
        try {
            const data = await authAPI.login(username, password);
            setUser(data.user);
            return data;
        } finally {
            setLoading(false);
        }
    };

    const register = async (username, email, password, role = 'student') => {
        setLoading(true);
        try {
            return await authAPI.register(username, email, password, role);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        authAPI.logout();
        setUser(null);
    };

    const isAdmin = () => user?.role === 'admin';
    const isPrincipal = () => user?.role === 'principal';

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAdmin,
        isPrincipal,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
