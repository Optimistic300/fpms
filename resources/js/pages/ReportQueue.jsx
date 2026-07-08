import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import ReportFilters from '../components/reports/ReportFilters';

const POLL_INTERVAL = 30000;

export default function ReportQueue() {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [error, setError] = useState('');
    const [meta, setMeta] = useState(null);
    const [filters, setFilters] = useState({ search: '', pendingOnly: true, division: '', type: '', status: '' });
    const [newCount, setNewCount] = useState(0);
    const pollingRef = useRef(null);
    const initialLoadRef = useRef(true);

    const buildQuery = useCallback((page = 1) => {
        const params = new URLSearchParams();
        if (filters.pendingOnly) {
            params.set('status', 'PENDING');
        } else if (filters.status) {
            params.set('status', filters.status);
        }
        if (filters.type) params.set('type', filters.type);
        if (filters.division) params.set('division', filters.division);
        if (filters.search) params.set('search', filters.search);
        params.set('sortBy', 'submittedAt');
        params.set('sortDirection', 'asc');
        params.set('page', String(page));
        params.set('limit', '20');
        return params.toString();
    }, [filters]);

    const fetchReports = useCallback(async (page = 1, append = false) => {
        try {
            const qs = buildQuery(page);
            const res = await axios.get(`/reports?${qs}`);
            const { data: fetched, meta: m } = res.data;
            if (append) {
                setReports((prev) => [...prev, ...fetched]);
            } else {
                setReports(fetched);
            }
            setMeta(m);
            setError('');
        } catch (err) {
            setError('Failed to load reports.');
        } finally {
            setLoading(false);
        }
    }, [buildQuery]);

    const fetchStats = useCallback(async () => {
        try {
            const res = await axios.get('/reports/stats');
            setStats(res.data.data);
            setStatsLoading(false);
        } catch {
            setStats(null);
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        initialLoadRef.current = true;
        fetchReports(1, false);
        fetchStats();

        pollingRef.current = setInterval(async () => {
            try {
                const q = buildQuery(1);
                const res = await axios.get(`/reports?${q}`);
                const { data: fetched, meta: m } = res.data;
                if (m.total > reports.length) {
                    setNewCount(m.total - reports.length);
                }
            } catch {
                // silent
            }
        }, POLL_INTERVAL);

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [fetchReports, fetchStats, buildQuery]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!initialLoadRef.current) {
            setLoading(true);
            fetchReports(1, false);
        }
        initialLoadRef.current = false;
    }, [fetchReports]);

    function handleLoadMore() {
        if (meta && meta.currentPage < meta.lastPage) {
            fetchReports(meta.currentPage + 1, true);
        }
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function handleRowClick(reportId) {
        navigate(`/queue/${reportId}`);
    }

    function statusBadge(status) {
        const colors = {
            PENDING: { bg: '#fef3c7', color: '#d97706' },
            APPROVED: { bg: '#dcfce7', color: '#16a34a' },
            RETURNED: { bg: '#fee2e2', color: '#dc2626' },
            ESCALATED: { bg: '#fce7f3', color: '#db2777' },
            DRAFT: { bg: '#f1f5f9', color: '#64748b' },
        };
        const c = colors[status] || colors.DRAFT;
        return (
            <span
                style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: c.bg,
                    color: c.color,
                    whiteSpace: 'nowrap',
                }}
            >
                {status}
            </span>
        );
    }

    function typeBadge(type) {
        const colors = {
            QUARTERLY: { bg: '#dbeafe', color: '#2563eb' },
            ANNUAL: { bg: '#e0e7ff', color: '#4f46e5' },
            COMPLETION: { bg: '#d1fae5', color: '#059669' },
            SPECIAL: { bg: '#ede9fe', color: '#7c3aed' },
            THESIS: { bg: '#fce7f3', color: '#db2777' },
        };
        const c = colors[type] || { bg: '#f1f5f9', color: '#64748b' };
        return (
            <span
                style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: c.bg,
                    color: c.color,
                    whiteSpace: 'nowrap',
                }}
            >
                {type}
            </span>
        );
    }

    const hasNewItems = newCount > 0;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                    Report Queue
                </h1>
                {hasNewItems && (
                    <button
                        type="button"
                        onClick={() => {
                            setLoading(true);
                            setNewCount(0);
                            fetchReports(1, false);
                        }}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            border: 'none',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        {newCount} new report(s)
                    </button>
                )}
            </div>

            {/* Stat Cards */}
            <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '8px',
                flexWrap: 'wrap',
            }}>
                <StatCard
                    label="Overdue"
                    value={statsLoading ? null : (stats?.overdue ?? 0)}
                    loading={statsLoading}
                    color="#dc2626"
                    borderColor="#dc2626"
                />
                <StatCard
                    label="Pending review"
                    value={statsLoading ? null : (stats?.pending ?? 0)}
                    loading={statsLoading}
                    color="#d97706"
                    borderColor="#d97706"
                />
                <StatCard
                    label="Approved this quarter"
                    value={statsLoading ? null : (stats?.approvedThisQuarter ?? 0)}
                    loading={statsLoading}
                    color="#16a34a"
                    borderColor="#16a34a"
                />
                <StatCard
                    label="Returned for revision"
                    value={statsLoading ? null : (stats?.returned ?? 0)}
                    loading={statsLoading}
                    color="#64748b"
                    borderColor="#64748b"
                />
            </div>

            {/* Filters */}
            <ReportFilters filters={filters} onChange={setFilters} />

            {/* Error */}
            {error && (
                <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    color: '#dc2626',
                    fontSize: '14px',
                    marginBottom: '12px',
                }}>
                    {error}
                </div>
            )}

            {/* Table */}
            {loading && reports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    Loading reports...
                </div>
            ) : reports.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#16a34a',
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>✓</div>
                    <div style={{ fontSize: '16px', fontWeight: 600 }}>No reports pending review.</div>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                                <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Report</th>
                                <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Researcher / Division</th>
                                <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Project</th>
                                <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Type</th>
                                <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Submitted</th>
                                <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Days</th>
                                <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
                                <th style={{ padding: '10px 12px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((r) => {
                                const isOverdue = r.daysWaiting > 7;
                                return (
                                    <tr
                                        key={r.id}
                                        onClick={() => handleRowClick(r.id)}
                                        style={{
                                            borderBottom: '1px solid #f1f5f9',
                                            cursor: 'pointer',
                                            backgroundColor: isOverdue ? '#fef2f2' : 'white',
                                            borderLeft: isOverdue ? '4px solid #dc2626' : '4px solid transparent',
                                            transition: 'background-color 0.1s',
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isOverdue ? '#fef2f2' : 'white'; }}
                                    >
                                        <td style={{ padding: '12px', fontWeight: 600, color: '#1e293b' }}>
                                            {r.reportName}
                                            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400 }}>
                                                {r.period || ''}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px', color: '#475569' }}>
                                            {r.submittedBy || '—'}
                                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{r.division || ''}</div>
                                        </td>
                                        <td style={{ padding: '12px', color: '#475569' }}>{r.projectTitle || ''}</td>
                                        <td style={{ padding: '12px' }}>
                                            {isOverdue ? (
                                                <span style={{
                                                    padding: '3px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    backgroundColor: '#fca5a5',
                                                    color: '#991b1b',
                                                }}>
                                                    Overdue
                                                </span>
                                            ) : (
                                                typeBadge(r.type)
                                            )}
                                        </td>
                                        <td style={{ padding: '12px', color: '#64748b', fontSize: '13px' }}>
                                            {r.submittedAt
                                                ? new Date(r.submittedAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })
                                                : '—'}
                                        </td>
                                        <td style={{
                                            padding: '12px',
                                            fontWeight: 600,
                                            color: isOverdue ? '#dc2626' : '#64748b',
                                        }}>
                                            {r.daysWaiting != null ? `${r.daysWaiting}d` : '—'}
                                        </td>
                                        <td style={{ padding: '12px' }}>{statusBadge(r.status)}</td>
                                        <td style={{ padding: '12px' }}>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleRowClick(r.id); }}
                                                style={{
                                                    padding: '6px 14px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #2563eb',
                                                    backgroundColor: 'white',
                                                    color: '#2563eb',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Load more */}
            {meta && meta.currentPage < meta.lastPage && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={loading}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: 'white',
                            color: '#475569',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {loading ? 'Loading...' : `Load more (${meta.currentPage} of ${meta.lastPage})`}
                    </button>
                </div>
            )}

            {/* Scroll to top when reports change or load more */}
            {reports.length > 0 && (
                <div style={{ textAlign: 'center', padding: '4px 0 20px' }}>
                    <button
                        type="button"
                        onClick={scrollToTop}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: 'white',
                            color: '#94a3b8',
                            fontSize: '12px',
                            cursor: 'pointer',
                        }}
                    >
                        ↑ Scroll to top
                    </button>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, loading, color, borderColor }) {
    if (loading) {
        return (
            <div style={{
                flex: 1,
                minWidth: '150px',
                padding: '16px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: `1px solid ${borderColor}40`,
                borderLeft: `4px solid ${borderColor}`,
            }}>
                <div style={{ height: '14px', width: '60%', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '10px' }} />
                <div style={{ height: '28px', width: '40%', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
            </div>
        );
    }

    return (
        <div style={{
            flex: 1,
            minWidth: '150px',
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: `1px solid ${borderColor}40`,
            borderLeft: `4px solid ${borderColor}`,
        }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color }}>{value ?? '—'}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{label}</div>
        </div>
    );
}