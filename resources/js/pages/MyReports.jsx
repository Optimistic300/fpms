import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import ReportTimeline from '../components/reports/ReportTimeline';
import ResubmitButton from '../components/reports/ResubmitButton';

function statusBadgeStyle(status) {
    const map = {
        DRAFT: { bg: '#f1f5f9', color: '#475569' },
        PENDING: { bg: '#fef3c7', color: '#92400e' },
        RETURNED: { bg: '#fee2e2', color: '#991b1b' },
        APPROVED: { bg: '#d1fae5', color: '#065f46' },
        ESCALATED: { bg: '#fce7f3', color: '#9d174d' },
    };
    return map[status] || { bg: '#f1f5f9', color: '#475569' };
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const PER_PAGE = 15;

export default function MyReports() {
    const navigate = useNavigate();

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [detailCache, setDetailCache] = useState({});
    const [detailLoading, setDetailLoading] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        apiClient
            .get('/reports', { params: { owner: 'me', page, limit: PER_PAGE } })
            .then((res) => {
                if (cancelled) return;
                setReports(res.data.data || []);
                setMeta(res.data.meta || null);
            })
            .catch(() => {
                if (!cancelled) setError('Failed to load reports.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [page]);

    function handleToggleExpand(reportId) {
        if (expandedId === reportId) {
            setExpandedId(null);
            return;
        }
        setExpandedId(reportId);

        if (!detailCache[reportId]) {
            setDetailLoading(reportId);
            apiClient
                .get(`/reports/${reportId}`)
                .then((res) => {
                    setDetailCache((prev) => ({ ...prev, [reportId]: res.data.data }));
                })
                .catch(() => {})
                .finally(() => setDetailLoading(null));
        }
    }

    function handleAction(report) {
        if (report.status === 'DRAFT') {
            navigate(`/reports/new?draft=${report.id}`);
        } else if (report.status === 'RETURNED') {
            navigate(`/reports/new?projectId=${report.projectId}&resubmit=${report.id}`);
        } else if (report.status === 'APPROVED') {
            handleToggleExpand(report.id);
        }
    }

    const needsAttention = reports.filter(
        (r) => r.status === 'RETURNED'
    ).length;

    return (
        <div>
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '24px',
                    flexWrap: 'wrap',
                    gap: '12px',
                }}
            >
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>
                        My Reports
                    </h1>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                        {meta ? `${meta.total} total submission${meta.total !== 1 ? 's' : ''}` : ''}
                        {needsAttention > 0 && (
                            <span style={{ color: '#dc2626', fontWeight: 600, marginLeft: '12px' }}>
                                {needsAttention} need{needsAttention === 1 ? 's' : ''} attention
                            </span>
                        )}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/reports/new')}
                    style={{
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'white',
                        backgroundColor: '#2563eb',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                    }}
                >
                    New Report
                </button>
            </div>

            {/* Error */}
            {error && (
                <div
                    style={{
                        padding: '12px 16px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        color: '#991b1b',
                        fontSize: '14px',
                        marginBottom: '20px',
                    }}
                >
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: '#94a3b8', fontSize: '14px' }}>
                    Loading...
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && reports.length === 0 && (
                <div
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        padding: '60px 20px',
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>{'\u{1F4CB}'}</div>
                    <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '20px' }}>
                        No reports yet
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/reports/new')}
                        style={{
                            padding: '10px 24px',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'white',
                            backgroundColor: '#2563eb',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                        }}
                    >
                        New Report
                    </button>
                </div>
            )}

            {/* Report List */}
            {!loading && !error && reports.length > 0 && (
                <>
                    <div
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Table Header */}
                        <div
                            style={{
                                display: 'flex',
                                gap: '12px',
                                padding: '12px 20px',
                                backgroundColor: '#f8fafc',
                                borderBottom: '2px solid #e2e8f0',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#64748b',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}
                        >
                            <div style={{ flex: '2' }}>Report</div>
                            <div style={{ flex: '1', display: 'none' }} className="md:block">
                                Project
                            </div>
                            <div style={{ flex: '1' }}>Submitted</div>
                            <div style={{ width: '90px' }}>Status</div>
                            <div style={{ width: '110px', textAlign: 'right' }}>Action</div>
                        </div>

                        {/* Rows */}
                        {reports.map((report, i) => {
                            const badge = statusBadgeStyle(report.status);
                            const isExpanded = expandedId === report.id;
                            const isLoadingDetail = detailLoading === report.id;

                            let actionLabel = '';
                            if (report.status === 'DRAFT') actionLabel = 'Continue';
                            else if (report.status === 'RETURNED') actionLabel = 'Resubmit';
                            else if (report.status === 'APPROVED') actionLabel = 'View';

                            return (
                                <div key={report.id}>
                                    <div
                                        onClick={() => handleToggleExpand(report.id)}
                                        style={{
                                            display: 'flex',
                                            gap: '12px',
                                            padding: '14px 20px',
                                            borderBottom:
                                                i < reports.length - 1 || isExpanded
                                                    ? '1px solid #f1f5f9'
                                                    : 'none',
                                            cursor: 'pointer',
                                            alignItems: 'center',
                                            transition: 'background-color 0.1s',
                                            backgroundColor:
                                                report.status === 'RETURNED' && !isExpanded
                                                    ? '#fef2f2'
                                                    : 'white',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor =
                                                report.status === 'RETURNED'
                                                    ? '#fee2e2'
                                                    : '#f8fafc';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor =
                                                report.status === 'RETURNED' && !isExpanded
                                                    ? '#fef2f2'
                                                    : 'white';
                                        }}
                                    >
                                        <div style={{ flex: '2', minWidth: 0 }}>
                                            <div
                                                style={{
                                                    fontSize: '14px',
                                                    fontWeight: 600,
                                                    color:
                                                        report.status === 'RETURNED'
                                                            ? '#991b1b'
                                                            : '#1e293b',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                                title={report.reportName}
                                            >
                                                {report.reportName || `${report.type} Report`}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: '12px',
                                                    color: '#94a3b8',
                                                    marginTop: '2px',
                                                }}
                                            >
                                                {report.period || ''}
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                flex: '1',
                                                fontSize: '13px',
                                                color: '#64748b',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {report.projectTitle || ''}
                                        </div>
                                        <div
                                            style={{
                                                flex: '1',
                                                fontSize: '13px',
                                                color: '#64748b',
                                            }}
                                        >
                                            {report.submittedAt ? formatDate(report.submittedAt) : '-'}
                                        </div>
                                        <div style={{ width: '90px' }}>
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '2px 8px',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    borderRadius: '4px',
                                                    backgroundColor: badge.bg,
                                                    color: badge.color,
                                                }}
                                            >
                                                {report.status}
                                            </span>
                                        </div>
                                        <div style={{ width: '110px', textAlign: 'right' }}>
                                            {actionLabel && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAction(report);
                                                    }}
                                                    style={{
                                                        padding: '6px 14px',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        color: 'white',
                                                        backgroundColor:
                                                            report.status === 'RETURNED'
                                                                ? '#dc2626'
                                                                : report.status === 'DRAFT'
                                                                  ? '#64748b'
                                                                  : '#2563eb',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontFamily: 'inherit',
                                                    }}
                                                >
                                                    {actionLabel}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Detail */}
                                    {isExpanded && (
                                        <div
                                            style={{
                                                padding: '16px 20px 20px',
                                                backgroundColor: '#fafafa',
                                                borderBottom:
                                                    i < reports.length - 1
                                                        ? '1px solid #e2e8f0'
                                                        : 'none',
                                            }}
                                        >
                                            {isLoadingDetail ? (
                                                <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                                                    Loading details...
                                                </div>
                                            ) : detailCache[report.id] ? (
                                                <div>
                                                    <ReportTimeline
                                                        history={detailCache[report.id].history}
                                                    />

                                                    {/* Show resubmit button for returned reports */}
                                                    {detailCache[report.id].status === 'RETURNED' && (
                                                        <div style={{ marginTop: '12px', textAlign: 'right' }}>
                                                            <ResubmitButton
                                                                reportId={report.id}
                                                                projectId={report.projectId}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {meta && meta.lastPage > 1 && (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '12px',
                                marginTop: '20px',
                                fontSize: '14px',
                                color: '#64748b',
                            }}
                        >
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                style={{
                                    padding: '8px 16px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: page <= 1 ? '#cbd5e1' : '#475569',
                                    backgroundColor: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                                    fontFamily: 'inherit',
                                }}
                            >
                                Previous
                            </button>
                            <span>
                                Page {meta.currentPage} of {meta.lastPage}
                            </span>
                            <button
                                type="button"
                                disabled={page >= meta.lastPage}
                                onClick={() => setPage((p) => Math.min(p + 1, meta.lastPage))}
                                style={{
                                    padding: '8px 16px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: page >= meta.lastPage ? '#cbd5e1' : '#475569',
                                    backgroundColor: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    cursor: page >= meta.lastPage ? 'not-allowed' : 'pointer',
                                    fontFamily: 'inherit',
                                }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
