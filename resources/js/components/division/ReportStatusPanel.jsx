import { Link } from 'react-router-dom';

function reportBadgeColor(status) {
    const map = {
        PENDING: { bg: '#fef3c7', color: '#92400e' },
        APPROVED: { bg: '#d1fae5', color: '#065f46' },
        RETURNED: { bg: '#fee2e2', color: '#991b1b' },
        DRAFT: { bg: '#f1f5f9', color: '#475569' },
        ESCALATED: { bg: '#fce7f3', color: '#9d174d' },
    };
    return map[status] || { bg: '#f1f5f9', color: '#475569' };
}

function SkeletonPanel({ rows = 3 }) {
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

function getFormattedDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ReportStatusPanel({ reports, loading, error, divisionId }) {
    if (loading) {
        return (
            <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
                    Division Report Status
                </div>
                <SkeletonPanel rows={3} />
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
                    Division Report Status
                </div>
                <div style={{ padding: '20px', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#991b1b', fontSize: '14px' }}>
                    Failed to load reports.
                </div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
                Division Report Status
            </div>
            {reports.length === 0 ? (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '32px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                    No reports yet.
                </div>
            ) : (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', gap: '12px', padding: '12px 20px', backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <div style={{ flex: 1.5 }}>Report Name</div>
                        <div style={{ flex: 1 }}>Researcher</div>
                        <div style={{ width: '90px' }}>Submitted</div>
                        <div style={{ width: '80px' }}>Status</div>
                    </div>
                    {reports.map((r, i) => {
                        const badge = reportBadgeColor(r.status);
                        return (
                            <div
                                key={r.id}
                                style={{
                                    display: 'flex',
                                    gap: '12px',
                                    padding: '14px 20px',
                                    borderBottom: i < reports.length - 1 ? '1px solid #f1f5f9' : 'none',
                                    alignItems: 'center',
                                }}
                            >
                                <div style={{ flex: '1.5', fontSize: '14px', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.reportName}>
                                    {r.reportName}
                                </div>
                                <div style={{ flex: 1, fontSize: '13px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.submittedBy}>
                                    {r.submittedBy}
                                </div>
                                <div style={{ width: '90px', fontSize: '12px', color: '#94a3b8' }}>
                                    {getFormattedDate(r.submittedAt)}
                                </div>
                                <div style={{ width: '80px' }}>
                                    <span style={{ display: 'inline-block', padding: '2px 8px', fontSize: '11px', fontWeight: 600, borderRadius: '4px', backgroundColor: badge.bg, color: badge.color }}>
                                        {r.status}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    <Link
                        to={`/reports?division=${divisionId}`}
                        style={{ display: 'block', padding: '10px 20px', fontSize: '13px', fontWeight: 500, color: '#2563eb', textDecoration: 'none', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}
                    >
                        All reports →
                    </Link>
                </div>
            )}
        </div>
    );
}
