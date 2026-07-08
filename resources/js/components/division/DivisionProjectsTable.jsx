import { useNavigate, Link } from 'react-router-dom';

function statusBadgeColor(status) {
    const map = {
        PROPOSED: { bg: '#fef3c7', color: '#92400e' },
        ACTIVE: { bg: '#dbeafe', color: '#1e40af' },
        COMPLETED: { bg: '#d1fae5', color: '#065f46' },
        ARCHIVED: { bg: '#f1f5f9', color: '#475569' },
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
                        gap: '16px',
                        padding: '14px 20px',
                        borderBottom: i < rows - 1 ? '1px solid #f1f5f9' : 'none',
                    }}
                >
                    <div style={{ flex: 2, height: '14px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                    <div style={{ flex: 1, height: '14px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                    <div style={{ width: '80px', height: '22px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                    <div style={{ width: '120px', height: '14px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                </div>
            ))}
        </div>
    );
}

export default function DivisionProjectsTable({ projects, loading, error, divisionId }) {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
                    Division Projects
                </div>
                <SkeletonTable rows={4} />
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
                    Division Projects
                </div>
                <div style={{ padding: '20px', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#991b1b', fontSize: '14px' }}>
                    Failed to load projects.
                </div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
                Division Projects
            </div>
            {projects.length === 0 ? (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '32px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                    No projects in this division.
                </div>
            ) : (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', gap: '16px', padding: '12px 20px', backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <div style={{ flex: 2 }}>Project Title</div>
                        <div style={{ flex: 1 }}>Lead Researcher</div>
                        <div style={{ width: '80px' }}>Status</div>
                        <div style={{ width: '120px' }}>Progress</div>
                    </div>
                    {projects.map((p, i) => (
                        <div
                            key={p.id}
                            onClick={() => navigate(`/projects/${p.id}`)}
                            style={{
                                display: 'flex',
                                gap: '16px',
                                padding: '14px 20px',
                                borderBottom: i < projects.length - 1 ? '1px solid #f1f5f9' : 'none',
                                cursor: 'pointer',
                                alignItems: 'center',
                                transition: 'background-color 0.1s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
                        >
                            <div style={{ flex: 2, fontSize: '14px', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.title}>
                                {p.title}
                            </div>
                            <div style={{ flex: 1, fontSize: '13px', color: '#64748b' }}>
                                {p.lead}
                            </div>
                            <div style={{ width: '80px' }}>
                                <span style={{ display: 'inline-block', padding: '2px 8px', fontSize: '11px', fontWeight: 600, borderRadius: '4px', backgroundColor: statusBadgeColor(p.status).bg, color: statusBadgeColor(p.status).color }}>
                                    {p.status}
                                </span>
                            </div>
                            <div style={{ width: '120px' }}>
                                <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${p.progress || 0}%`, backgroundColor: (p.progress || 0) >= 80 ? '#22c55e' : (p.progress || 0) >= 40 ? '#3b82f6' : '#f59e0b', borderRadius: '3px', transition: 'width 0.3s' }} />
                                </div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', textAlign: 'right' }}>{p.progress || 0}%</div>
                            </div>
                        </div>
                    ))}
                    <Link
                        to={`/projects?division=${divisionId}`}
                        style={{ display: 'block', padding: '10px 20px', fontSize: '13px', fontWeight: 500, color: '#2563eb', textDecoration: 'none', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}
                    >
                        View all {projects.length} →
                    </Link>
                </div>
            )}
        </div>
    );
}
