import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import ReviewActions from '../components/reports/ReviewActions';
import CommentsSection from '../components/reports/CommentsSection';

export default function ReportReview() {
    const { reportId } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [queuePosition, setQueuePosition] = useState(null);
    const [queueTotal, setQueueTotal] = useState(null);
    const [priorReports, setPriorReports] = useState([]);
    const [toast, setToast] = useState(null);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`/reports/${reportId}`);
            const r = res.data.data;
            setReport(r);

            // Fetch queue position
            const queueRes = await axios.get('/reports?status=PENDING&sortBy=submittedAt&sortDirection=asc&limit=100');
            const queueData = queueRes.data.data || [];
            setQueueTotal(queueData.length);
            const idx = queueData.findIndex((qr) => qr.id === parseInt(reportId, 10));
            setQueuePosition(idx >= 0 ? idx + 1 : null);

            // Fetch prior approved reports (same project & submitter)
            if (r.projectId && r.submittedBy) {
                try {
                    const priorRes = await axios.get(`/reports?projectId=${r.projectId}&status=APPROVED&limit=10`);
                    setPriorReports(priorRes.data.data || []);
                } catch {
                    setPriorReports([]);
                }
            }
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setError('Report not found.');
            } else {
                setError('Failed to load report.');
            }
        } finally {
            setLoading(false);
        }
    }, [reportId]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    function showToast(message, type = 'success') {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }

    async function handleAction(newStatus, comment) {
        setActionLoading(true);
        try {
            await axios.patch(`/reports/${reportId}`, { status: newStatus, comment: comment || '' });
            showToast(`Report ${newStatus.toLowerCase()}.`);

            // Navigate to next in queue or back to queue
            if (queueTotal > 1 && queuePosition < queueTotal) {
                // Fetch queue again to find next report
                const queueRes = await axios.get('/reports?status=PENDING&sortBy=submittedAt&sortDirection=asc&limit=100');
                const queueData = queueRes.data.data;
                if (queueData.length > 0) {
                    navigate(`/queue/${queueData[0].id}`);
                    return;
                }
            }
            navigate('/queue');
        } catch (err) {
            const msg = err.response?.data?.message || 'Action failed. Please try again.';
            showToast(msg, 'error');
        } finally {
            setActionLoading(false);
        }
    }

    function handleNextInQueue() {
        if (queueTotal > 0 && queuePosition != null) {
            navigate(`/queue/${reportId}`); // just re-fetch current
        }
    }

    if (loading) {
        return (
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 0' }}>
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Loading report...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 0' }}>
                <div style={{
                    padding: '20px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#dc2626', marginBottom: '12px' }}>
                        {error}
                    </div>
                    <Link
                        to="/queue"
                        style={{
                            color: 'var(--color-primary)',
                            fontSize: '14px',
                            textDecoration: 'none',
                            fontWeight: 600,
                        }}
                    >
                        Back to Report Queue
                    </Link>
                </div>
            </div>
        );
    }

    if (!report) return null;

    const isResubmission = report.version && report.version > 1;
    const hasFile = report.file && (report.file.filename || report.file.url);

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    backgroundColor: toast.type === 'success' ? '#16a34a' : '#dc2626',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}>
                    {toast.message}
                </div>
            )}

            {/* Breadcrumb */}
            <div style={{
                fontSize: '13px',
                color: '#94a3b8',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
            }}>
                <Link to="/queue" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Report queue</Link>
                <span>›</span>
                <span style={{ color: '#64748b', fontWeight: 500 }}>{report.reportName || `Report #${report.id}`}</span>
            </div>

            {/* Queue navigation */}
            {queueTotal > 0 && queuePosition != null && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    padding: '10px 16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                }}>
                    <span style={{ fontSize: '14px', color: '#64748b' }}>
                        {queuePosition} of {queueTotal} in queue
                    </span>
                    <button
                        type="button"
                        onClick={handleNextInQueue}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: 'white',
                            color: '#475569',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Next in queue →
                    </button>
                </div>
            )}

            {/* Two-column layout */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 320px',
                gap: '20px',
                alignItems: 'start',
            }}>
                {/* Left column: Report content */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    padding: '24px',
                }}>
                    {/* Title & metadata */}
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', margin: '0 0 8px 0' }}>
                        {report.reportName || `Report #${report.id}`}
                        {isResubmission && (
                            <span style={{
                                marginLeft: '10px',
                                padding: '3px 10px',
                                borderRadius: '12px',
                                backgroundColor: '#ede9fe',
                                color: '#7c3aed',
                                fontSize: '12px',
                                fontWeight: 600,
                                verticalAlign: 'middle',
                            }}>
                                v{report.version} (resubmission)
                            </span>
                        )}
                    </h2>

                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px', lineHeight: 1.6 }}>
                        <div><strong style={{ color: '#475569' }}>Researcher:</strong> {report.submittedBy || '—'}</div>
                        <div><strong style={{ color: '#475569' }}>Division:</strong> {report.division || '—'}</div>
                        <div><strong style={{ color: '#475569' }}>Period:</strong> {report.period || '—'}</div>
                        <div><strong style={{ color: '#475569' }}>Submitted:</strong> {report.submittedAt
                            ? new Date(report.submittedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })
                            : '—'}
                        </div>
                    </div>

                    {/* Narrative summary */}
                    {report.narrativeSummary && (
                        <div style={{
                            padding: '16px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            marginBottom: '20px',
                        }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                                Narrative Summary
                            </div>
                            <div style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                {report.narrativeSummary}
                            </div>
                        </div>
                    )}

                    {/* Attached file */}
                    {hasFile && (
                        <div style={{
                            marginBottom: '20px',
                            padding: '12px 16px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                        }}>
                            <div style={{ fontSize: '20px' }}>📎</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                                    {report.file.filename || 'Attached file'}
                                </div>
                                {report.file.size && (
                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                        {Math.round(report.file.size / 1024)} KB
                                    </div>
                                )}
                            </div>
                            <a
                                href={report.file.url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    backgroundColor: 'white',
                                    color: 'var(--color-primary)',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                }}
                            >
                                Preview
                            </a>
                            <a
                                href={report.file.url || '#'}
                                download={report.file.filename}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    backgroundColor: 'white',
                                    color: '#475569',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                }}
                            >
                                Download
                            </a>
                        </div>
                    )}

                    {/* Prior approved submissions */}
                    {priorReports.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>
                                Prior Approved Reports ({priorReports.length})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {priorReports.map((pr) => (
                                    <div
                                        key={pr.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '10px 12px',
                                            backgroundColor: '#f8fafc',
                                            borderRadius: '6px',
                                            border: '1px solid #e2e8f0',
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                                                {pr.reportName || `Report #${pr.id}`}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                Approved: {pr.submittedAt
                                                    ? new Date(pr.submittedAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })
                                                    : '—'}
                                            </div>
                                        </div>
                                        <a
                                            href={`/queue/${pr.id}`}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: '4px',
                                                border: '1px solid #e2e8f0',
                                                backgroundColor: 'white',
                                                color: 'var(--color-primary)',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                textDecoration: 'none',
                                            }}
                                        >
                                            View
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Comments section */}
                    <CommentsSection
                        comments={report.comments || []}
                        onSubmitComment={async (text) => {
                            // Comments submitted via PATCH action, not separate endpoint
                            showToast('Comment posting is handled through review actions.', 'error');
                        }}
                    />

                    {/* Submission timeline */}
                    {report.history && report.history.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '12px' }}>
                                Submission History
                            </div>
                            <div style={{ position: 'relative', paddingLeft: '24px' }}>
                                <div style={{
                                    position: 'absolute',
                                    left: '8px',
                                    top: '4px',
                                    bottom: '4px',
                                    width: '2px',
                                    backgroundColor: '#e2e8f0',
                                }} />
                                {report.history.map((event, i) => {
                                    const label = event.event.charAt(0) + event.event.slice(1).toLowerCase();
                                    return (
                                        <div key={i} style={{ position: 'relative', marginBottom: i < report.history.length - 1 ? '14px' : 0 }}>
                                            <div style={{
                                                position: 'absolute',
                                                left: '-20px',
                                                top: '4px',
                                                width: '10px',
                                                height: '10px',
                                                borderRadius: '50%',
                                                backgroundColor: '#64748b',
                                                border: '2px solid white',
                                            }} />
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{label}</div>
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
                                                <div style={{
                                                    marginTop: '6px',
                                                    padding: '8px 10px',
                                                    backgroundColor: '#f8fafc',
                                                    borderLeft: '3px solid #64748b',
                                                    borderRadius: '4px',
                                                    fontSize: '13px',
                                                    color: '#475569',
                                                    whiteSpace: 'pre-wrap',
                                                }}>
                                                    {event.comment}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right column: Action panel */}
                <div>
                    <ReviewActions
                        report={report}
                        onAction={handleAction}
                        loading={actionLoading}
                    />
                </div>
            </div>
        </div>
    );
}