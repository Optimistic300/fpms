import { tokens } from '../../design-tokens';

export default function StatCard({ label, value, icon, onClick, isActive, loading, hint }) {
    if (loading) {
        return (
            <div
                style={{
                    flex: 1,
                    minWidth: '180px',
                    padding: tokens.spacing[5],
                    backgroundColor: tokens.colors.background.main,
                    borderRadius: tokens.borderRadius.md,
                    border: `1px solid ${tokens.colors.neutral[200]}`,
                }}
            >
                <div
                    style={{
                        height: '16px',
                        width: '60%',
                        backgroundColor: tokens.colors.neutral[200],
                        borderRadius: tokens.borderRadius.sm,
                        marginBottom: tokens.spacing[3],
                    }}
                />
                <div
                    style={{
                        height: '32px',
                        width: '40%',
                        backgroundColor: tokens.colors.neutral[200],
                        borderRadius: tokens.borderRadius.md,
                    }}
                />
                <div
                    style={{
                        height: '12px',
                        width: '80%',
                        backgroundColor: tokens.colors.neutral[200],
                        borderRadius: tokens.borderRadius.sm,
                        marginTop: tokens.spacing[3],
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
                padding: tokens.spacing[5],
                backgroundColor: isActive ? tokens.colors.primary[50] : tokens.colors.background.main,
                borderRadius: tokens.borderRadius.md,
                border: `1px solid ${isActive ? tokens.colors.primary[300] : tokens.colors.neutral[200]}`,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                borderLeft: `4px solid ${isActive ? tokens.colors.primary[500] : tokens.colors.neutral[200]}`,
                fontFamily: tokens.typography.fontFamily.base,
            }}
            onMouseEnter={(e) => {
                if (!isActive) {
                    e.currentTarget.style.borderColor = tokens.colors.primary[100];
                    e.currentTarget.style.borderLeftColor = tokens.colors.primary[300];
                }
            }}
            onMouseLeave={(e) => {
                if (!isActive) {
                    e.currentTarget.style.borderColor = tokens.colors.neutral[200];
                    e.currentTarget.style.borderLeftColor = tokens.colors.neutral[200];
                }
            }}
        >
<div style={{ 
    fontSize: tokens.typography.fontSize['2xl'], 
    marginBottom: tokens.spacing[2] 
}}>{icon}</div>
            <div style={{ 
                fontSize: tokens.typography.fontSize['3xl'], 
                fontWeight: tokens.typography.fontWeight.bold, 
                color: tokens.colors.neutral[900] 
            }}>
                {value ?? '—'}
            </div>
            <div style={{ 
                fontSize: tokens.typography.fontSize.base, 
                color: tokens.colors.neutral[500], 
                marginTop: tokens.spacing[1] 
            }}>
                {label}
            </div>
            <div style={{ 
                fontSize: tokens.typography.fontSize.xs, 
                color: tokens.colors.neutral[400], 
                marginTop: tokens.spacing[1.5] 
            }}>
                {hint || 'Click to filter'}
            </div>
        </button>
    );
}
