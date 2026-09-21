import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/axios';
import { useNotification } from '../contexts/NotificationContext';

export default function ReportDetail() {
    const { id: reportId } = useParams();
    const navigate = useNavigate();
    const { refreshCount } = useNotification();

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Review Actions State
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [actionError, setActionError] = useState(null);

    const fetchReport = useCallback(async () => {
        if (!reportId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(`/reports/${reportId}`);
            setReport(response.data.data || response.data);
        } catch (err) {
            setError('Failed to load report details.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [reportId]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const handleBack = () => {
        navigate(-1);
    };

    const handleStatusUpdate = async (targetStatus) => {
        // Validation check for status that requires a comment
        if ((targetStatus === 'RETURNED' || targetStatus === 'ESCALATED') && !comment.trim()) {
            setActionError(`A comment is required to ${targetStatus.toLowerCase()} this report.`);
            return;
        }

        setSubmitting(true);
        setActionError(null);

        try {
            const response = await apiClient.patch(`/reports/${reportId}`, {
                status: targetStatus,
                comment: comment.trim() || undefined,
            });

            // Update report in state with the new data from response
            setReport(response.data.data || response.data);
            setComment('');
        } catch (err) {
            setActionError(err.response?.data?.message || `Failed to update report to ${targetStatus}.`);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadgeStyle = (status) => {
        switch (status?.toUpperCase()) {
            case 'APPROVED':
                return { backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' };
            case 'RETURNED':
                return { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' };
            case 'ESCALATED':
                return { backgroundColor: '#f3e8ff', color: '#6b21a8', border: '1px solid #d8b4fe' };
            case 'PENDING':
                return { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
            default:
                return { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' };
        }
    };

    if (loading) {
        return <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Loading report details...</div>;
    }

    if (error) {
        return <div style={{ padding: '24px', color: '#ef4444', textAlign: 'center' }}>{error}</div>;
    }

    if (!report) {
        return <div style={{ padding: '24px', textAlign: 'center' }}>Report not found.</div>;
    }

    const reportTitle = report.reportName || report.title || 'Untitled Report';
    const reportContent = report.narrativeSummary || report.content || 'No content available';
    const submittedDate = report.submittedAt || report.createdAt;
    const isPending = report.status === 'PENDING';

    return (
        <div style={{ padding: '24px', maxWidth: '850px', margin: '0 auto', fontFamily: 'inherit' }}>
            {/* Back Button */}
            <button
                onClick={handleBack}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '20px',
                    padding: 0,
                }}
            >
                &larr; Back to Reports
            </button>

            {/* Main Details Card */}
            <div
                style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '24px',
                    marginBottom: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
            >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                        <span style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>
                            {report.type || 'REPORT'}
                        </span>
                        <h1 style={{ margin: '6px 0 0 0', fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {reportTitle}
                        </h1>
                    </div>

                    <span
                        style={{
                            padding: '4px 12px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: '600',
                            ...getStatusBadgeStyle(report.status),
                        }}
                    >
                        {report.status || 'N/A'}
                    </span>
                </div>

                {/* Metadata Grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px',
                        paddingTop: '16px',
                        borderTop: '1px solid #f3f4f6',
                    }}
                >
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>PROJECT</label>
                        <p style={{ margin: '4px 0 0 0', color: '#111827', fontSize: '15px' }}>{report.projectTitle || 'N/A'}</p>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>SUBMITTED BY</label>
                        <p style={{ margin: '4px 0 0 0', color: '#111827', fontSize: '15px' }}>
                            {report.submittedBy || 'N/A'} {report.division ? `(${report.division})` : ''}
                        </p>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>SUBMITTED DATE</label>
                        <p style={{ margin: '4px 0 0 0', color: '#111827', fontSize: '15px' }}>
                            {submittedDate ? new Date(submittedDate).toLocaleString() : 'N/A'}
                        </p>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>PERIOD</label>
                        <p style={{ margin: '4px 0 0 0', color: '#111827', fontSize: '15px' }}>{report.period || 'N/A'}</p>
                    </div>
                </div>

                {/* Content / Narrative Summary */}
                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f3f4f6' }}>
                    <label style={{ display: 'block', fontSize: '14px', color: '#374151', fontWeight: '600', marginBottom: '8px' }}>
                        Narrative Summary
                    </label>
                    <div
                        style={{
                            backgroundColor: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            padding: '16px',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            color: '#1f2937',
                            whiteSpace: 'pre-line',
                        }}
                    >
                        {reportContent}
                    </div>
                </div>

                {/* File Attachment */}
                {report.file?.filename && (
                    <div style={{ marginTop: '20px' }}>
                        <label style={{ display: 'block', fontSize: '14px', color: '#374151', fontWeight: '600', marginBottom: '8px' }}>
                            Attached Document
                        </label>
                        <div
                            style={{
                                display: 'inline-block',
                                padding: '10px 14px',
                                backgroundColor: '#f3f4f6',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '14px',
                                color: '#2563eb',
                                fontWeight: '500',
                            }}
                        >
                            📎 {report.file.filename}
                        </div>
                    </div>
                )}
            </div>

            {/* Review Decision Panel (Only active when report is PENDING) */}
            {isPending && (
                <div
                    style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '24px',
                        marginBottom: '24px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                >
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                        Review Report
                    </h3>

                    {actionError && (
                        <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '12px' }}>{actionError}</p>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>
                            Review Comments / Notes
                        </label>
                        <textarea
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Add comments or feedback (Required for Returning or Escalating)..."
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit',
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleStatusUpdate('APPROVED')}
                            style={{
                                backgroundColor: '#16a34a',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '10px 20px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                opacity: submitting ? 0.7 : 1,
                            }}
                        >
                            {submitting ? 'Processing...' : 'Approve Report'}
                        </button>

                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleStatusUpdate('RETURNED')}
                            style={{
                                backgroundColor: '#dc2626',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '10px 20px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                opacity: submitting ? 0.7 : 1,
                            }}
                        >
                            {submitting ? 'Processing...' : 'Return Report'}
                        </button>

                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleStatusUpdate('ESCALATED')}
                            style={{
                                backgroundColor: '#9333ea',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '10px 20px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                opacity: submitting ? 0.7 : 1,
                            }}
                        >
                            {submitting ? 'Processing...' : 'Escalate'}
                        </button>
                    </div>
                </div>
            )}

            {/* History Section */}
            {Array.isArray(report.history) && report.history.length > 0 && (
                <div
                    style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '24px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                >
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                        Activity History
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {report.history.map((item, index) => (
                            <div
                                key={index}
                                style={{
                                    backgroundColor: '#f9fafb',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    padding: '12px',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
                                    <span style={{ fontWeight: '600', color: '#374151' }}>{item.user}</span>
                                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                                </div>
                                <div style={{ marginTop: '4px', fontSize: '13px', fontWeight: '600', color: '#2563eb' }}>
                                    {item.event}
                                </div>
                                {item.comment && (
                                    <div style={{ marginTop: '6px', fontSize: '13px', color: '#4b5563' }}>
                                        {item.comment}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}