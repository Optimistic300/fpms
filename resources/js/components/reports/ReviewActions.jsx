import { useState } from 'react';

export default function ReviewActions({ report, onAction, loading }) {
    const [comment, setComment] = useState(report.comment || '');
    const [commentError, setCommentError] = useState('');

    function validateComment(required) {
        if (required && !comment.trim()) {
            setCommentError('Comment is required for return and escalation.');
            return false;
        }
        setCommentError('');
        return true;
    }

    function handleApprove() {
        onAction('APPROVED', comment.trim());
    }

    function handleReturn() {
        if (!validateComment(true)) return;
        onAction('RETURNED', comment.trim());
    }

    function handleEscalate() {
        if (!validateComment(true)) return;
        onAction('ESCALATED', comment.trim());
    }

    const isResubmission = report.version && report.version > 1;

    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
        }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                Review Action
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <Row label="Type" value={report.type || '—'} />
                <Row label="Version" value={
                    <span>
                        v{report.version || 1}
                        {isResubmission && (
                            <span style={{
                                marginLeft: '6px',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                backgroundColor: '#ede9fe',
                                color: '#7c3aed',
                                fontSize: '12px',
                                fontWeight: 600,
                            }}>
                                resubmission
                            </span>
                        )}
                    </span>
                } />
                <Row label="Days waiting" value={report.daysWaiting != null ? `${report.daysWaiting} days` : '—'} />
                <Row label="Prior approved" value={
                    report.priorApprovedCount != null ? `${report.priorApprovedCount} report(s)` : '—'
                } />
            </div>

            <div>
                <label
                    htmlFor="review-comment"
                    style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#475569',
                        marginBottom: '6px',
                    }}
                >
                    Comment <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Required for return and escalation)</span>
                </label>
                <textarea
                    id="review-comment"
                    value={comment}
                    onChange={(e) => {
                        setComment(e.target.value);
                        if (commentError) setCommentError('');
                    }}
                    rows={4}
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${commentError ? '#ef4444' : '#e2e8f0'}`,
                        fontSize: '14px',
                        resize: 'vertical',
                        outline: 'none',
                        boxSizing: 'border-box',
                    }}
                    placeholder="Enter your review comments..."
                />
                {commentError && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                        {commentError}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                    type="button"
                    onClick={handleApprove}
                    disabled={loading}
                    style={{
                        padding: '10px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: loading ? '#94a3b8' : '#16a34a',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                >
                    {loading ? 'Processing...' : 'Approve'}
                </button>
                <button
                    type="button"
                    onClick={handleReturn}
                    disabled={loading}
                    style={{
                        padding: '10px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: loading ? '#94a3b8' : '#dc2626',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                >
                    {loading ? 'Processing...' : 'Return for revision'}
                </button>
                <button
                    type="button"
                    onClick={handleEscalate}
                    disabled={loading}
                    style={{
                        padding: '10px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: loading ? '#94a3b8' : '#9333ea',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                >
                    {loading ? 'Processing...' : 'Escalate to management'}
                </button>
            </div>

            <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', lineHeight: 1.5 }}>
                All decisions are timestamped and recorded. The researcher is notified immediately.
            </div>
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b' }}>{label}</span>
            <span style={{ color: '#1e293b', fontWeight: 600 }}>{value}</span>
        </div>
    );
}