import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export default function OfflineIndicator() {
    const { isOnline } = useOnlineStatus();

    if (isOnline) return null;

    return (
        <div
            style={{
                backgroundColor: '#f59e0b',
                color: '#1c1917',
                textAlign: 'center',
                padding: '6px 16px',
                fontSize: '14px',
                fontWeight: 500,
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
            }}
            role="alert"
        >
            You are offline. Changes will sync when reconnected.
        </div>
    );
}
