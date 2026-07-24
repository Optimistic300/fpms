export default function PipelineStrip({ pipeline, loading }) {
    const stages = [
        { key: 'draft', label: 'Draft', color: '#94a3b8' },
        { key: 'submitted', label: 'Submitted', color: '#b45309' },
        { key: 'inRevision', label: 'In revision', color: '#7c3aed' },
        { key: 'published', label: 'Published', color: '#16a34a' },
    ];

    const containerStyle = {
        display: 'flex', gap: '12px', marginBottom: '24px',
    };

    const boxStyle = (color) => ({
        flex: 1, padding: '16px', backgroundColor: 'white',
        borderRadius: '8px', border: '1px solid #e2e8f0',
        borderTop: `3px solid ${color}`,
        textAlign: 'center',
    });

    const countStyle = {
        fontSize: '28px', fontWeight: 700, color: '#1e293b',
    };

    const labelStyle = {
        fontSize: '13px', color: '#64748b', marginTop: '4px',
    };

    if (loading) {
        return (
            <div style={containerStyle}>
                {stages.map((s) => (
                    <div key={s.key} style={boxStyle(s.color)}>
                        <div style={{ height: '28px', width: '40%', backgroundColor: '#e2e8f0', borderRadius: '4px', margin: '0 auto', animation: 'pulse 1.5s infinite' }} />
                        <div style={{ height: '14px', width: '60%', backgroundColor: '#e2e8f0', borderRadius: '4px', margin: '8px auto 0', animation: 'pulse 1.5s infinite' }} />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            {stages.map((s) => (
                <div key={s.key} style={boxStyle(s.color)}>
                    <div style={countStyle}>{pipeline?.[s.key] ?? 0}</div>
                    <div style={labelStyle}>{s.label}</div>
                </div>
            ))}
        </div>
    );
}
