import { useNavigate } from 'react-router-dom';

const severityConfig = {
    danger: { icon: '🔴', color: '#dc2626', bg: '#fef2f2' },
    warning: { icon: '🟡', color: '#d97706', bg: '#fffbeb' },
    success: { icon: '🟢', color: '#16a34a', bg: '#f0fdf4' },
    info: { icon: '🔵', color: 'var(--color-primary)', bg: '#eff6ff' },
};

function Skeleton() {
    return (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            {Array.from({ length: 3 }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        display: 'flex', gap: '12px', padding: '14px 20px',
                        borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none',
                    }}
                >
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#e2e8f0', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ height: '14px', width: '90%', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '6px' }} />
                        <div style={{ height: '12px', width: '50%', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function InstituteAlertsSkeleton() {
    return <Skeleton />;
}

export default function InstituteAlerts({ alerts, loading, error }) {
    const navigate = useNavigate();

    if (loading) return <Skeleton />;
    if (error) {
        return (
            <div style={{ padding: '20px', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#991b1b', fontSize: '14px' }}>
                Failed to load alerts.
            </div>
        );
    }
    if (!alerts || alerts.length === 0) {
        return (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '32px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                No alerts at this time.
            </div>
        );
    }

    function getSeverity(alert) {
        if (alert.severity) return alert.severity;
        if (alert.type === 'report_overdue' || alert.type === 'queue_backlog') return 'danger';
        if (alert.type === 'milestone') return 'success';
        if (alert.type === 'document_milestone' || alert.type === 'paper_status') return 'info';
        return 'info';
    }

    function getTime(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        const now = new Date();
        const diff = Math.floor((now - d) / 60000);
        if (diff < 60) return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    return (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            {alerts.map((a, i) => {
                const sev = getSeverity(a);
                const cfg = severityConfig[sev] || severityConfig.info;
                return (
                    <div
                        key={a.id}
                        style={{
                            display: 'flex', gap: '12px', padding: '14px 20px',
                            alignItems: 'flex-start',
                            borderBottom: i < alerts.length - 1 ? '1px solid #f1f5f9' : 'none',
                            backgroundColor: cfg.bg,
                        }}
                    >
                        <div style={{ fontSize: '16px', lineHeight: '1.4', flexShrink: 0 }}>{cfg.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', color: '#1e293b', lineHeight: '1.4', marginBottom: '2px' }}>
                                {a.message}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{getTime(a.timestamp)}</div>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                if (a.link) navigate(a.link);
                            }}
                            style={{
                                background: 'none', border: 'none', fontSize: '16px', cursor: a.link ? 'pointer' : 'default',
                                color: '#94a3b8', padding: '0', lineHeight: '1.4', flexShrink: 0, fontFamily: 'inherit',
                            }}
                            aria-label="Navigate"
                        >
                            →
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
