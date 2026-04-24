import axios from 'axios';

export function isTokenValid(token) {
    try {
        if (!token) return false;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
    } catch {
        return false;
    }
}

let _onUnauthorized = null;

export function setAuthHandlers({ onUnauthorized }) {
    _onUnauthorized = onUnauthorized;
}

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api'
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        config.headers['Content-Type'] = 'application/json;charset=UTF-8';
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (_onUnauthorized) {
                _onUnauthorized();
            } else {
                localStorage.clear();
                window.location.replace('/');
            }
        }
        return Promise.reject(error);
    }
);

export default api;
