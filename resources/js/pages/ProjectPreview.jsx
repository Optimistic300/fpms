import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../api/axios';

const statusBadge = {
    PROPOSED: { bg: '#fef3c7', color: '#92400e' },
    ACTIVE: { bg: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' },
    COMPLETED: { bg: '#d1fae5', color: '#065f46' },
    ARCHIVED: { bg: '#f1f5f9', color: '#475569' },
};

export default function ProjectPreview() {
    const { id } = useParams();

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [requesting, setRequesting] = useState(false);
    const [requested, setRequested] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        apiClient
            .get(`/projects/${id}`)
            .then((res) => {
                setProject(res.data.data);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to load project details.');
                setLoading(false);
            });
    }, [id]);

    async function handleRequestAccess() {
        setRequesting(true);
        try {
            await apiClient.post(`/projects/${id}/access-requests`);
            setRequested(true);
            setToast('Access request sent.');
            setTimeout(() => setToast(null), 4000);
        } catch {
            setToast('Failed to send request. Please try again.');
            setTimeout(() => setToast(null), 4000);
        } finally {
            setRequesting(false);
        }
    }

    if (loading) {
        return (
            <div style={{ padding: '20px', color: '#94a3b8', fontSize: '14px' }}>
                Loading project...
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    padding: '20px',
                    backgroundColor: '#fef2f2',
                    borderRadius: '8px',
                    color: '#991b1b',
                    fontSize: '14px',
                }}
            >
                {error}
            </div>
        );
    }

    if (!project) return null;

    const badge = statusBadge[project.status] || { bg: '#f1f5f9', color: '#475569' };

    return (
        <div>
            {toast && (
                <div
                    style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        padding: '12px 20px',
                        backgroundColor: requested ? '#d1fae5' : '#fef2f2',
                        color: requested ? '#065f46' : '#991b1b',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 500,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 300,
                        animation: 'slideIn 0.3s ease',
                    }}
                >
                    {toast}
                </div>
            )}

            <div
                style={{
                    maxWidth: '640px',
                    margin: '0 auto',
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    padding: '32px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '8px',
                    }}
                >
                    <span style={{ fontSize: '32px' }}>🔒</span>
                    <span
                        style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#92400e',
                            backgroundColor: '#fef3c7',
                            padding: '3px 10px',
                            borderRadius: '5px',
                        }}
                    >
                        LIMITED ACCESS
                    </span>
                </div>

                <h1
                    style={{
                        fontSize: '24px',
                        fontWeight: 700,
                        color: '#1e293b',
                        margin: '0 0 16px 0',
                    }}
                >
                    {project.title}
                </h1>

                <div style={{ marginBottom: '24px' }}>
                    <span
                        style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            fontSize: '12px',
                            fontWeight: 600,
                            borderRadius: '5px',
                            backgroundColor: badge.bg,
                            color: badge.color,
                        }}
                    >
                        {project.status}
                    </span>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                        fontSize: '14px',
                        color: '#64748b',
                        marginBottom: '32px',
                    }}
                >
                    <div>
                        <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '2px' }}>
                            Lead Researcher
                        </div>
                        <div style={{ color: '#1e293b', fontWeight: 500 }}>{project.lead}</div>
                    </div>
                    <div>
                        <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '2px' }}>
                            Division
                        </div>
                        <div style={{ color: '#1e293b', fontWeight: 500 }}>{project.division}</div>
                    </div>
                    <div>
                        <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '2px' }}>
                            Research Area
                        </div>
                        <div style={{ color: '#1e293b', fontWeight: 500 }}>
                            {project.researchArea || 'N/A'}
                        </div>
                    </div>
                    <div>
                        <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '2px' }}>
                            Status
                        </div>
                        <div style={{ color: '#1e293b', fontWeight: 500 }}>{project.status}</div>
                    </div>
                    <div>
                        <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '2px' }}>
                            Start Date
                        </div>
                        <div style={{ color: '#1e293b', fontWeight: 500 }}>
                            {project.startDate}
                        </div>
                    </div>
                    <div>
                        <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '2px' }}>
                            End Date
                        </div>
                        <div style={{ color: '#1e293b', fontWeight: 500 }}>
                            {project.endDate || 'Ongoing'}
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
                    <p
                        style={{
                            fontSize: '14px',
                            color: '#64748b',
                            margin: '0 0 16px 0',
                        }}
                    >
                        You do not have access to this project. Request access to view activities,
                        documents, and reports.
                    </p>
                    <button
                        type="button"
                        onClick={handleRequestAccess}
                        disabled={requesting || requested}
                        style={{
                            padding: '12px 28px',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'white',
                            backgroundColor: requested
                                ? '#94a3b8'
                                : requesting
                                  ? 'var(--color-primary-lighter)'
                                  : 'var(--color-primary)',
                            border: 'none',
                            borderRadius: '8px',
                            cursor:
                                requesting || requested ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
                            transition: 'all 0.15s',
                        }}
                    >
                        {requested
                            ? 'Access Requested'
                            : requesting
                              ? 'Requesting...'
                              : 'Request Access'}
                    </button>
                </div>
            </div>
        </div>
    );
}
