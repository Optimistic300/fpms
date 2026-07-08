export default function ReportTimeline({ history = [] }) {
    if (!history || history.length === 0) return null;

    const eventConfig = {
        SUBMITTED: { label: 'Submitted', color: '#2563eb', bg: '#dbeafe' },
        RETURNED: { label: 'Returned with comments', color: '#dc2626', bg: '#fee2e2' },
        RESUBMITTED: { label: 'Resubmitted', color: '#7c3aed', bg: '#ede9fe' },
        APPROVED: { label: 'Approved', color: '#16a34a', bg: '#dcfce7' },
        ESCALATED: { label: 'Escalated', color: '#db2777', bg: '#fce7f3' },
    };

    const sorted = [...history].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    return (
        <div style={{ padding: '12px 0' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '12px' }}>
                Submission Timeline
            </div>
            <div style={{ position: 'relative', paddingLeft: '24px' }}>
                <div
                    style={{
                        position: 'absolute',
                        left: '8px',
                        top: '4px',
                        bottom: '4px',
                        width: '2px',
                        backgroundColor: '#e2e8f0',
                    }}
                />
                {sorted.map((event, i) => {
                    const cfg = eventConfig[event.event] || {
                        label: event.event,
                        color: '#64748b',
                        bg: '#f1f5f9',
                    };
                    return (
                        <div key={i} style={{ position: 'relative', marginBottom: i < sorted.length - 1 ? '16px' : 0 }}>
                            <div
                                style={{
                                    position: 'absolute',
                                    left: '-20px',
                                    top: '4px',
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    backgroundColor: cfg.color,
                                    border: '2px solid white',
                                }}
                            />
                            <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: 600 }}>
                                {cfg.label}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                                {new Date(event.timestamp).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                                {event.user ? ` · ${event.user}` : ''}
                            </div>
                            {event.comment && (
                                <div
                                    style={{
                                        marginTop: '8px',
                                        padding: '10px 12px',
                                        backgroundColor: event.event === 'RETURNED' ? '#fef2f2' : '#f8fafc',
                                        borderLeft: `3px solid ${cfg.color}`,
                                        borderRadius: '4px',
                                        fontSize: '13px',
                                        color: '#475569',
                                        lineHeight: '1.5',
                                        whiteSpace: 'pre-wrap',
                                    }}
                                >
                                    {event.comment}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
