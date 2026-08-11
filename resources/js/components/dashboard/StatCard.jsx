export default function StatCard({ label, value, icon, onClick, isActive, loading, hint }) {
    if (loading) {
        return (
            <div
                style={{
                    flex: 1,
                    minWidth: '180px',
                    padding: '20px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                }}
            >
                <div
                    style={{
                        height: '16px',
                        width: '60%',
                        backgroundColor: '#e2e8f0',
                        borderRadius: '4px',
                        marginBottom: '12px',
                        animation: 'pulse 1.5s infinite',
                    }}
                />
                <div
                    style={{
                        height: '32px',
                        width: '40%',
                        backgroundColor: '#e2e8f0',
                        borderRadius: '4px',
                        animation: 'pulse 1.5s infinite',
                    }}
                />
                <div
                    style={{
                        height: '12px',
                        width: '80%',
                        backgroundColor: '#e2e8f0',
                        borderRadius: '4px',
                        marginTop: '12px',
                        animation: 'pulse 1.5s infinite',
                    }}
                />
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                flex: 1,
                minWidth: '180px',
                padding: '20px',
                backgroundColor: isActive ? '#eff6ff' : 'white',
                borderRadius: '8px',
                border: `1px solid ${isActive ? 'var(--color-primary-mid)' : '#e2e8f0'}`,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                borderLeft: `4px solid ${isActive ? 'var(--color-primary-mid)' : '#e2e8f0'}`,
                fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
                if (!isActive) {
                    e.currentTarget.style.borderColor = 'var(--color-primary-lighter)';
                    e.currentTarget.style.borderLeftColor = 'var(--color-primary-mid)';
                }
            }}
            onMouseLeave={(e) => {
                if (!isActive) {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.borderLeftColor = '#e2e8f0';
                }
            }}
        >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>
                {value ?? '—'}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                {label}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                {hint || 'Click to filter'}
            </div>
        </button>
    );
}
