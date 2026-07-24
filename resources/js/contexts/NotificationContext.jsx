import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/axios';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshCount = useCallback(async () => {
        try {
            const response = await apiClient.get('/inbox', {
                params: { page: 1, limit: 1 },
            });
            const meta = response.data?.meta || response.data?.data?.meta;
            if (meta?.unreadCount !== undefined) {
                setUnreadCount(meta.unreadCount);
            }
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        refreshCount();
        const interval = setInterval(refreshCount, 60000);
        return () => clearInterval(interval);
    }, [refreshCount]);

    return (
        <NotificationContext.Provider value={{ unreadCount, refreshCount }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}

export default NotificationContext;
