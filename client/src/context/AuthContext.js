import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setAuthHandlers, isTokenValid } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => {
        const stored = localStorage.getItem('token');
        return (stored && isTokenValid(stored)) ? stored : null;
    });

    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('token');
        if (!stored || !isTokenValid(stored)) return null;
        try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
    });

    const login = useCallback((data) => {
        const u = { fullName: data.fullName, email: data.email, role: data.role };
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(u));
        setToken(data.token);
        setUser(u);
    }, []);

    const logout = useCallback(() => {
        localStorage.clear();
        setToken(null);
        setUser(null);
    }, []);

    useEffect(() => {
        setAuthHandlers({ onUnauthorized: logout });
    }, [logout]);

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
