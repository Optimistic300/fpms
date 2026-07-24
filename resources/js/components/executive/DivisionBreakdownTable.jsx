import { useNavigate } from 'react-router-dom';

function complianceColor(pct) {
    if (pct === 100) return '#22c55e';
    if (pct >= 80) return '#f59e0b';
    return '#ef4444';
}

function Skeleton() {
    return (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            {Array.from({ length: 3 }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        display: 'flex', gap: '16px', padding: '14px 20px',
                        borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none',
                    }}
                >
                    <div style={{ flex: 2, height: '14px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                    <div style={{ flex: 1, height: '14px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                    <div style={{ flex: 1, height: '14px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                    <div style={{ width: '70px', height: '22px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                </div>
            ))}
        </div>
    );
}

export function DivisionBreakdownTableSkeleton() {
    return <Skeleton />;
}

export default function DivisionBreakdownTable({ divisions, loading, error }) {
    const navigate = useNavigate();

    if (loading) return <Skeleton />;
    if (error) {
        return (
            <div style={{ padding: '20px', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#991b1b', fontSize: '14px' }}>
                Failed to load division breakdown.
            </div>
        );
    }
    if (!divisions || divisions.length === 0) {
        return (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '32px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                No division data available.
            </div>
        );
    }

    const headerStyle = {
        display: 'flex', gap: '16px', padding: '12px 20px', backgroundColor: '#f8fafc',
        borderBottom: '2px solid #e2e8f0', fontSize: '12px', fontWeight: 600,
        color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px',
    };

    return (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
            <div style={headerStyle}>
                <div style={{ flex: 2 }}>Division / Head</div>
                <div style={{ flex: 1, textAlign: 'center' }}>Projects</div>
                <div style={{ flex: 1, textAlign: 'center' }}>Ongoing</div>
                <div style={{ flex: 1, textAlign: 'center' }}>Staff</div>
                <div style={{ flex: 1, textAlign: 'center' }}>Documents</div>
                <div style={{ flex: 1.5 }}>Reports</div>
                <div style={{ width: '90px', textAlign: 'center' }}>Compliance</div>
            </div>
            {divisions.map((d, i) => (
                <div
                    key={d.id}
                    onClick={() => navigate(`/division?divisionId=${d.id}`)}
                    style={{
                        display: 'flex', gap: '16px', padding: '14px 20px',
                        borderBottom: i < divisions.length - 1 ? '1px solid #f1f5f9' : 'none',
                        cursor: 'pointer', alignItems: 'center',
                        transition: 'background-color 0.1s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
                >
                    <div style={{ flex: 2 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{d.name}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{d.head}</div>
                    </div>
                    <div style={{ flex: 1, fontSize: '14px', color: '#1e293b', textAlign: 'center', fontWeight: 600 }}>{d.totalProjects}</div>
                    <div style={{ flex: 1, fontSize: '14px', color: '#1e293b', textAlign: 'center' }}>{d.ongoing}</div>
                    <div style={{ flex: 1, fontSize: '14px', color: '#1e293b', textAlign: 'center' }}>{d.activeStaff}</div>
                    <div style={{ flex: 1, fontSize: '14px', color: '#1e293b', textAlign: 'center' }}>{d.documentCount}</div>
                    <div style={{ flex: 1.5, fontSize: '13px', color: '#64748b' }}>{d.reportStatusSummary || '—'}</div>
                    <div style={{ width: '90px', textAlign: 'center' }}>
                        <span
                            style={{
                                display: 'inline-block', padding: '2px 8px', fontSize: '12px', fontWeight: 700,
                                borderRadius: '4px', color: 'white', backgroundColor: complianceColor(d.compliancePercentage),
                            }}
                        >
                            {d.compliancePercentage != null ? `${d.compliancePercentage}%` : '—'}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
