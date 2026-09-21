import { Link } from 'react-router-dom';

function statusBadgeColor(status) {
    const map = {
        SUBMITTED: { bg: '#fef3c7', color: '#92400e' },
        PUBLISHED: { bg: '#d1fae5', color: '#065f46' },
        DRAFT: { bg: '#f1f5f9', color: '#475569' },
        REJECTED: { bg: '#fee2e2', color: '#991b1b' },
    };
    return map[status] || { bg: '#f1f5f9', color: '#475569' };
}

function getMonthDay(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Skeleton() {
    return (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ padding: '14px 20px', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ height: '14px', width: '80%', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '8px' }} />
                    <div style={{ height: '12px', width: '50%', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '6px' }} />
                    <div style={{ height: '12px', width: '35%', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                </div>
            ))}
        </div>
    );
}

export function PublicationsPanelSkeleton() {
    return <Skeleton />;
}

export default function PublicationsPanel({ publications, loading, error }) {
    if (loading) return <Skeleton />;
    if (error) {
        return (
            <div style={{ padding: '20px', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#991b1b', fontSize: '14px' }}>
                Failed to load publications.
            </div>
        );
    }
    if (!publications || publications.length === 0) {
        return (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '32px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                No publications yet.
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            {publications.map((p, i) => {
                const badge = statusBadgeColor(p.status);
                return (
                    <div
                        key={p.id}
                        style={{
                            padding: '14px 20px',
                            borderBottom: i < publications.length - 1 ? '1px solid #f1f5f9' : 'none',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', flex: 1, marginRight: '8px', lineHeight: '1.4' }}>
                                {p.title}
                            </div>
                            <span
                                style={{
                                    display: 'inline-block', padding: '2px 8px', fontSize: '11px', fontWeight: 600,
                                    borderRadius: '4px', backgroundColor: badge.bg, color: badge.color, whiteSpace: 'nowrap',
                                }}
                            >
                                {p.status}
                            </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                            {p.authors || '—'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', gap: '8px' }}>
                            {p.journal && <span>{p.journal}</span>}
                            {p.date && <span>· {getMonthDay(p.date)}</span>}
                        </div>
                    </div>
                );
            })}
            <Link
                to="/publications"
                style={{
                    display: 'block', padding: '10px 20px', fontSize: '13px', fontWeight: 500,
                    color: 'var(--color-primary)', textDecoration: 'none', textAlign: 'center',
                    borderTop: '1px solid #f1f5f9',
                }}
            >
                All publications →
            </Link>
        </div>
    );
}
