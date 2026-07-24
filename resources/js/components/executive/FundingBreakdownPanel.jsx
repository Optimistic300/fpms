function Skeleton() {
    return (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px' }}>
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ marginBottom: '16px' }}>
                    <div style={{ height: '12px', width: '30%', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '6px' }} />
                    <div style={{ height: '24px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                </div>
            ))}
        </div>
    );
}

const barColors = {
    DONOR: '#3b82f6',
    GOVERNMENT: '#22c55e',
    INTERNAL: '#f59e0b',
};

const barLabels = {
    DONOR: 'Donor',
    GOVERNMENT: 'Government',
    INTERNAL: 'Internal',
};

export function FundingBreakdownPanelSkeleton() {
    return <Skeleton />;
}

export default function FundingBreakdownPanel({ breakdown, loading, error }) {
    if (loading) return <Skeleton />;
    if (error) {
        return (
            <div style={{ padding: '20px', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#991b1b', fontSize: '14px' }}>
                Failed to load funding breakdown.
            </div>
        );
    }
    if (!breakdown) {
        return (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '32px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                No funding data available.
            </div>
        );
    }

    const keys = ['DONOR', 'GOVERNMENT', 'INTERNAL'];
    const maxCount = Math.max(...keys.map((k) => breakdown[k] || 0), 1);

    return (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px' }}>
            {keys.map((key) => {
                const count = breakdown[key] || 0;
                const widthPct = (count / maxCount) * 100;
                return (
                    <div key={key} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 600, color: '#1e293b' }}>{barLabels[key]}</span>
                            <span>{count} project{count !== 1 ? 's' : ''}</span>
                        </div>
                        <div style={{ height: '24px', backgroundColor: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                            <div
                                style={{
                                    height: '100%', width: `${widthPct}%`, backgroundColor: barColors[key],
                                    borderRadius: '6px', transition: 'width 0.4s ease', minWidth: count > 0 ? '4px' : '0',
                                }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
