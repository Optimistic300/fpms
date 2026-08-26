import axios from 'axios';
import { enqueue, processQueue } from '../services/offlineQueue';

const apiClient = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

const MUTATION_METHODS = ['post', 'put', 'patch', 'delete'];

apiClient.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const method = config.method.toLowerCase();
        if (MUTATION_METHODS.includes(method)) {
            await enqueue(
                config.method.toUpperCase(),
                config.url,
                config.data || null
            );
            const error = new Error('Offline: request queued');
            error.isOfflineQueue = true;
            error.config = config;
            throw error;
        }
    }

    return config;
}, (error) => Promise.reject(error));

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (!error.isOfflineQueue && !error.response && typeof navigator !== 'undefined' && !navigator.onLine) {
            const config = error.config;
            if (config && MUTATION_METHODS.includes(config.method.toLowerCase())) {
                await enqueue(
                    config.method.toUpperCase(),
                    config.url,
                    config.data || null
                );
                const queuedError = new Error('Offline: request queued for retry');
                queuedError.isOfflineQueue = true;
                return Promise.reject(queuedError);
            }
        }

        if (error.response && error.response.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

let replayPromise = null;

export async function replayOfflineQueue() {
    if (replayPromise) return replayPromise;
    replayPromise = (async () => {
        try {
            const result = await processQueue(apiClient);
            return result;
        } finally {
            replayPromise = null;
        }
    })();
    return replayPromise;
}

export default apiClient;
