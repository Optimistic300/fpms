import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/axios';
import PipelineStrip from '../components/publications/PipelineStrip';
import PublicationCard from '../components/publications/PublicationCard';
import AddPublicationModal from '../components/publications/AddPublicationModal';
import EditPublicationModal from '../components/publications/EditPublicationModal';

const TABS = [
    { key: 'all', label: 'All' },
    { key: 'mine', label: 'Mine' },
    { key: 'published', label: 'Published' },
    { key: 'inProgress', label: 'In progress' },
    { key: 'student', label: 'CCST student work' },
];

export default function Publications() {
    const { user } = useAuth();

    const [publications, setPublications] = useState([]);
    const [pipeline, setPipeline] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [activeTab, setActiveTab] = useState('all');
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editPub, setEditPub] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [pubRes, pipeRes] = await Promise.all([
                apiClient.get('/publications'),
                apiClient.get('/publications/pipeline'),
            ]);
            setPublications(pubRes.data?.data || []);
            setPipeline(pipeRes.data?.data || null);
        } catch {
            setError('Failed to load publications.');
            setPublications([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const stats = {
        total: publications.length,
        published: publications.filter((p) => p.status === 'PUBLISHED').length,
        inProgress: publications.filter((p) => p.status !== 'PUBLISHED' && p.status !== 'DRAFT').length,
        publishedThisYear: publications.filter((p) => {
            if (p.status !== 'PUBLISHED') return false;
            const year = p.submittedAt ? new Date(p.submittedAt).getFullYear() : null;
            return year === new Date().getFullYear();
        }).length,
    };

    const filtered = publications.filter((pub) => {
        switch (activeTab) {
            case 'mine':
                return pub.submittedById === user?.userId;
            case 'published':
                return pub.status === 'PUBLISHED';
            case 'inProgress':
                return pub.status !== 'PUBLISHED' && pub.status !== 'DRAFT';
            case 'student':
                return pub.type === 'STUDENT';
            default:
                return true;
        }
    });

    async function handleDelete(id) {
        try {
            await apiClient.delete(`/publications/${id}`);
            setPublications((prev) => prev.filter((p) => p.id !== id));
            setDeleteConfirm(null);
        } catch {
            // silently fail
        }
    }

    function handleCreated(pub) {
        setPublications((prev) => [pub, ...prev]);
    }

    function handleUpdated(pub) {
        setPublications((prev) =>
            prev.map((p) => (p.id === pub.id ? { ...p, ...pub } : p))
        );
    }

    const canAdd = user?.role !== 'SECRETARY' && user?.role !== 'ADMIN';

    const containerStyle = { maxWidth: '960px', margin: '0 auto', padding: '24px 16px' };

    const headerStyle = {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '20px',
    };

    const titleStyle = {
        fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: 0,
    };

    const addBtnStyle = {
        padding: '9px 20px', fontSize: '14px', fontWeight: 600,
        color: 'white', backgroundColor: 'var(--color-primary)', border: 'none',
        borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit',
    };

    const statRowStyle = {
        display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap',
    };

    const statCardStyle = (color) => ({
        flex: 1, minWidth: '160px', padding: '16px 20px',
        backgroundColor: 'white', borderRadius: '8px',
        border: '1px solid #e2e8f0',
        borderLeft: `4px solid ${color}`,
    });

    const statValueStyle = {
        fontSize: '28px', fontWeight: 700, color: '#1e293b',
    };

    const statLabelStyle = {
        fontSize: '13px', color: '#64748b', marginTop: '2px',
    };

    const tabBarStyle = {
        display: 'flex', gap: '4px', marginBottom: '20px',
        borderBottom: '2px solid #e2e8f0', paddingBottom: '0',
    };

    const tabStyle = (isActive) => ({
        padding: '10px 16px', fontSize: '13px', fontWeight: 500,
        color: isActive ? 'var(--color-primary)' : '#64748b',
        backgroundColor: 'transparent', border: 'none',
        borderBottom: `2px solid ${isActive ? 'var(--color-primary)' : 'transparent'}`,
        cursor: 'pointer', fontFamily: 'inherit',
        marginBottom: '-2px',
    });

    const cardGridStyle = {
        display: 'flex', flexDirection: 'column', gap: '12px',
    };

    const emptyStyle = {
        textAlign: 'center', padding: '60px 20px', color: '#94a3b8',
    };

    const confirmOverlayStyle = {
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 300, padding: '20px',
    };

    const confirmBoxStyle = {
        backgroundColor: 'white', borderRadius: '10px', padding: '24px',
        maxWidth: '400px', width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h1 style={titleStyle}>Publications</h1>
                {canAdd && (
                    <button type="button" onClick={() => setAddModalOpen(true)} style={addBtnStyle}>
                        + Add Publication
                    </button>
                )}
            </div>

            {loading && (
                <>
                    <div style={statRowStyle}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} style={statCardStyle('#e2e8f0')}>
                                <div style={{ height: '28px', width: '40%', backgroundColor: '#e2e8f0', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                                <div style={{ height: '14px', width: '70%', backgroundColor: '#e2e8f0', borderRadius: '4px', marginTop: '8px', animation: 'pulse 1.5s infinite' }} />
                            </div>
                        ))}
                    </div>
                    <PipelineStrip loading={true} />
                </>
            )}

            {error && (
                <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '6px', fontSize: '14px', marginBottom: '16px' }}>
                    {error}
                </div>
            )}

            {!loading && !error && (
                <>
                    <div style={statRowStyle}>
                        <div style={statCardStyle('var(--color-primary-mid)')}>
                            <div style={statValueStyle}>{stats.total}</div>
                            <div style={statLabelStyle}>Total tracked</div>
                        </div>
                        <div style={statCardStyle('#16a34a')}>
                            <div style={statValueStyle}>{stats.published}</div>
                            <div style={statLabelStyle}>Published</div>
                        </div>
                        <div style={statCardStyle('#d97706')}>
                            <div style={statValueStyle}>{stats.inProgress}</div>
                            <div style={statLabelStyle}>In progress</div>
                        </div>
                        <div style={statCardStyle('var(--color-primary-mid)')}>
                            <div style={statValueStyle}>{stats.publishedThisYear}</div>
                            <div style={statLabelStyle}>Published this year</div>
                        </div>
                    </div>

                    <PipelineStrip pipeline={pipeline} loading={false} />
                </>
            )}

            <div style={tabBarStyle}>
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        style={tabStyle(activeTab === tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {!loading && filtered.length === 0 && (
                <div style={emptyStyle}>
                    <p style={{ fontSize: '16px' }}>No publications found.</p>
                </div>
            )}

            {!loading && filtered.length > 0 && (
                <div style={cardGridStyle}>
                    {filtered.map((pub) => (
                        <PublicationCard
                            key={pub.id}
                            publication={pub}
                            user={user}
                            onEdit={(p) => setEditPub(p)}
                            onDelete={(p) => setDeleteConfirm(p.id)}
                        />
                    ))}
                </div>
            )}

            <AddPublicationModal
                isOpen={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                onCreated={handleCreated}
            />

            <EditPublicationModal
                isOpen={editPub !== null}
                onClose={() => setEditPub(null)}
                publication={editPub}
                onUpdated={handleUpdated}
            />

            {deleteConfirm && (
                <div style={confirmOverlayStyle} onClick={() => setDeleteConfirm(null)}>
                    <div style={confirmBoxStyle} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Delete Publication</h3>
                        <p style={{ fontSize: '14px', color: '#475569', marginBottom: '20px' }}>
                            Are you sure you want to delete this publication?
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setDeleteConfirm(null)} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#475569', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                            <button type="button" onClick={() => handleDelete(deleteConfirm)} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: 'white', backgroundColor: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
