import { Link } from 'react-router-dom';

function SkeletonFeed({ rows = 3 }) {
    return (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px' }}>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: i < rows - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ height: '14px', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '8px', width: '90%' }} />
                        <div style={{ height: '12px', backgroundColor: '#e2e8f0', borderRadius: '4px', width: '60%' }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function getTimeAgo(timestamp) {
    const d = new Date(timestamp);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ActivityFeedList({ activities, loading, error }) {
    if (loading) {
        return (
            <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
                    Activity Feed
                </div>
                <SkeletonFeed rows={4} />
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
                    Activity Feed
                </div>
                <div style={{ padding: '20px', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#991b1b', fontSize: '14px' }}>
                    Failed to load activity feed.
                </div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
                Activity Feed
            </div>
            {activities.length === 0 ? (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '32px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                    No recent activity.
                </div>
            ) : (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {activities.map((a, i) => (
                        <div
                            key={i}
                            style={{
                                padding: '14px 20px',
                                borderBottom: i < activities.length - 1 ? '1px solid #f1f5f9' : 'none',
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'flex-start',
                            }}
                        >
                            <div style={{ fontSize: '16px', marginTop: '1px', flexShrink: 0 }}>
                                {a.type === 'alert' ? '⚠️' : '📌'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        fontSize: '14px',
                                        color: a.type === 'alert' ? '#92400e' : '#1e293b',
                                        marginBottom: '4px',
                                        lineHeight: '1.4',
                                    }}
                                >
                                    {a.type === 'alert' ? (
                                        <span style={{ fontWeight: 600 }}>{a.message}</span>
                                    ) : (
                                        a.message
                                    )}
                                </div>
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                    {getTimeAgo(a.timestamp)}
                                </div>
                            </div>
                            {a.link && (
                                <Link
                                    to={a.link}
                                    style={{ fontSize: '12px', color: 'var(--color-primary)', textDecoration: 'none', flexShrink: 0, marginTop: '2px' }}
                                >
                                    View
                                </Link>
                            )}
                        </div>
                    ))}
                    <Link
                        to={`/activities`}
                        style={{ display: 'block', padding: '10px 20px', fontSize: '13px', fontWeight: 500, color: 'var(--color-primary)', textDecoration: 'none', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}
                    >
                        View all →
                    </Link>
                </div>
            )}
        </div>
    );
}
