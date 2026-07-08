import { useNavigate } from 'react-router-dom';

function reportBadgeColor(status) {
    const map = {
        SUBMITTED: { bg: '#d1fae5', color: '#065f46' },
        PENDING: { bg: '#fef3c7', color: '#92400e' },
        DUE_SOON: { bg: '#fef3c7', color: '#92400e' },
        OVERDUE: { bg: '#fee2e2', color: '#991b1b' },
        APPROVED: { bg: '#d1fae5', color: '#065f46' },
        RETURNED: { bg: '#fee2e2', color: '#991b1b' },
        DRAFT: { bg: '#f1f5f9', color: '#475569' },
    };
    return map[status] || { bg: '#f1f5f9', color: '#475569' };
}

function SkeletonTable({ rows = 3 }) {
    return (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '14px 20px',
                        borderBottom: i < rows - 1 ? '1px solid #f1f5f9' : 'none',
                    }}
                >
                    <div style={{ flex: 1.5, height: '14px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                    <div style={{ flex: 1, height: '14px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                    <div style={{ width: '60px', height: '14px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                    <div style={{ width: '60px', height: '14px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                    <div style={{ width: '80px', height: '22px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                </div>
            ))}
        </div>
    );
}

export default function ResearcherActivityTable({ researchers, loading, error }) {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
                    Researcher Activity
                </div>
                <SkeletonTable rows={4} />
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
                    Researcher Activity
                </div>
                <div style={{ padding: '20px', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#991b1b', fontSize: '14px' }}>
                    Failed to load researcher activity.
                </div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
                Researcher Activity
            </div>
            {researchers.length === 0 ? (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '32px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                    No researchers in this division.
                </div>
            ) : (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                    <div style={{ display: 'flex', gap: '12px', padding: '12px 20px', backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '600px' }}>
                        <div style={{ flex: '1.5' }}>Name</div>
                        <div style={{ flex: 1 }}>Projects</div>
                        <div style={{ width: '60px', textAlign: 'center' }}>Activities</div>
                        <div style={{ width: '60px', textAlign: 'center' }}>Docs</div>
                        <div style={{ width: '80px' }}>Report</div>
                    </div>
                    {researchers.map((r, i) => {
                        const badge = reportBadgeColor(r.reportStatus);
                        return (
                            <div
                                key={r.researcherId}
                                onClick={() => navigate(`/activities?researcher=${r.researcherId}`)}
                                style={{
                                    display: 'flex',
                                    gap: '12px',
                                    padding: '14px 20px',
                                    borderBottom: i < researchers.length - 1 ? '1px solid #f1f5f9' : 'none',
                                    cursor: 'pointer',
                                    alignItems: 'center',
                                    transition: 'background-color 0.1s',
                                    minWidth: '600px',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
                            >
                                <div style={{ flex: '1.5', fontSize: '14px', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.fullName}>
                                    {r.fullName}
                                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400, marginLeft: '6px' }}>
                                        ({r.activeProjects} active)
                                    </span>
                                </div>
                                <div style={{ flex: 1, fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.projects}>
                                    {r.projects}
                                </div>
                                <div style={{ width: '60px', fontSize: '13px', color: '#1e293b', fontWeight: 600, textAlign: 'center' }}>
                                    {r.activitiesThisMonth}
                                </div>
                                <div style={{ width: '60px', fontSize: '13px', color: '#1e293b', fontWeight: 600, textAlign: 'center' }}>
                                    {r.documentsUploaded}
                                </div>
                                <div style={{ width: '80px' }}>
                                    <span style={{ display: 'inline-block', padding: '2px 8px', fontSize: '11px', fontWeight: 600, borderRadius: '4px', backgroundColor: badge.bg, color: badge.color }}>
                                        {r.reportStatus === 'DUE_SOON' ? 'Due soon' : r.reportStatus === 'SUBMITTED' ? 'Submitted' : r.reportStatus}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
