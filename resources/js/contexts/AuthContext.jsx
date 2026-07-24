import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/axios';

const AuthContext = createContext(null);

const roleRedirectMap = {
    RESEARCHER: '/dashboard',
    STUDENT: '/dashboard',
    SECRETARY: '/queue',
    DIVISION_HEAD: '/division',
    MANAGEMENT: '/executive',
    ADMIN: '/users',
};

export function getRoleRedirect(role) {
    return roleRedirectMap[role] || '/dashboard';
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('auth_user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function validate() {
            const storedToken = localStorage.getItem('auth_token');
            if (!storedToken) {
                if (!cancelled) setLoading(false);
                return;
            }
            try {
                const response = await apiClient.get('/auth/validate');
                const data = response.data.data;
                if (!cancelled) {
                    const userData = {
                        userId: data.userId,
                        fullName: data.fullName,
                        email: data.email,
                        role: data.role,
                        division: data.division,
                    };
                    setUser(userData);
                    setToken(storedToken);
                    localStorage.setItem('auth_user', JSON.stringify(userData));
                }
            } catch {
                if (!cancelled) {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('auth_user');
                    setToken(null);
                    setUser(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        validate();

        return () => {
            cancelled = true;
        };
    }, []);

    const login = useCallback(async (email, password) => {
        const response = await apiClient.post('/auth/login', { email, password });
        const data = response.data.data;
        const userData = {
            userId: data.userId,
            fullName: data.fullName,
            email: data.email,
            role: data.role,
            division: data.division,
        };
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        setToken(data.token);
        setUser(userData);
        return userData;
    }, []);

    const logout = useCallback(async () => {
        try {
            await apiClient.post('/auth/logout');
        } catch {
            // ignore
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setToken(null);
            setUser(null);
        }
    }, []);

    const isAuthenticated = !!token && !!user;

    return (
        <AuthContext.Provider value={{ token, user, isAuthenticated, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
