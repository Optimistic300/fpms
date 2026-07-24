function complianceColor(pct) {
    if (pct === 100) return '#22c55e';
    if (pct >= 80) return '#f59e0b';
    return '#ef4444';
}

function Skeleton() {
    return (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px' }}>
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ width: '120px', height: '12px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                    <div style={{ flex: 1, height: '20px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                    <div style={{ width: '40px', height: '12px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                </div>
            ))}
        </div>
    );
}

export function ComplianceChartSkeleton() {
    return <Skeleton />;
}

export default function ComplianceChart({ data, loading, error }) {
    if (loading) return <Skeleton />;
    if (error) {
        return (
            <div style={{ padding: '20px', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#991b1b', fontSize: '14px' }}>
                Failed to load compliance data.
            </div>
        );
    }
    if (!data || data.length === 0) {
        return (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '32px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                No compliance data available.
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>Compliance by Division</div>
            {data.map((item, i) => {
                const pct = item.compliancePercentage;
                const color = complianceColor(pct);
                return (
                    <div key={item.divisionName || i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                        <div style={{ width: '120px', fontSize: '13px', color: '#1e293b', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.divisionName}
                        </div>
                        <div style={{ flex: 1, height: '20px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                                style={{
                                    height: '100%', width: `${pct}%`, backgroundColor: color,
                                    borderRadius: '4px', transition: 'width 0.4s ease', minWidth: pct > 0 ? '4px' : '0',
                                }}
                            />
                        </div>
                        <div style={{ width: '40px', fontSize: '13px', fontWeight: 700, color, textAlign: 'right' }}>
                            {pct}%
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
