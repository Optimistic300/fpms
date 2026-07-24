import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/axios';

const reportStatusBadge = {
    DRAFT: { bg: '#f1f5f9', color: '#475569' },
    SUBMITTED: { bg: '#fef3c7', color: '#92400e' },
    APPROVED: { bg: '#d1fae5', color: '#065f46' },
    REJECTED: { bg: '#fef2f2', color: '#991b1b' },
};

export default function ReportsTab({ projectId, selected }) {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!selected || loaded) return;
        setLoading(true);
        apiClient
            .get('/reports', { params: { projectId } })
            .then((res) => {
                setReports(res.data.data || []);
                setLoaded(true);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, [selected, loaded, projectId]);

    if (!selected) return null;

    if (loading) {
        return (
            <div style={{ padding: '20px 0', color: '#94a3b8', fontSize: '14px' }}>
                Loading reports...
            </div>
        );
    }

    if (reports.length === 0) {
        return (
            <div
                style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: '14px',
                }}
            >
                No reports submitted yet.
            </div>
        );
    }

    return (
        <div>
            {reports.map((report) => {
                const badge = reportStatusBadge[report.status] || {
                    bg: '#f1f5f9',
                    color: '#475569',
                };
                return (
                    <div
                        key={report.id}
                        onClick={() => navigate(`/reports/${report.id}`)}
                        style={{
                            display: 'flex',
                            gap: '12px',
                            padding: '14px 16px',
                            borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            alignItems: 'center',
                            transition: 'background-color 0.1s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '';
                        }}
                    >
                        <div style={{ flex: 2, fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>
                            {report.name}
                        </div>
                        <div style={{ flex: 1, fontSize: '13px', color: '#64748b' }}>
                            {report.period}
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
                        <div style={{ flex: 1, fontSize: '13px', color: '#64748b' }}>
                            {report.submittedAt}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
