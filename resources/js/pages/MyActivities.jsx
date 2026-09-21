import { useState, useEffect, useCallback, Fragment } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../api/axios';
import EditActivityModal from '../components/activities/EditActivityModal';

export default function MyActivities() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [activities, setActivities] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [projectFilter, setProjectFilter] = useState(searchParams.get('projectId') || '');
    const [typeFilter, setTypeFilter] = useState('');
    const [projects, setProjects] = useState([]);
    const [activityTypes, setActivityTypes] = useState([]);

    const [expandedId, setExpandedId] = useState(null);
    const [editActivity, setEditActivity] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [publishConfirmId, setPublishConfirmId] = useState(null);
    const [forwardDocId, setForwardDocId] = useState(null);
    const [forwardRecipient, setForwardRecipient] = useState('');
    const [deleteDocId, setDeleteDocId] = useState(null);
    const [exporting, setExporting] = useState(false);

    const limit = 20;

    useEffect(() => {
        Promise.all([
            apiClient.get('/projects').catch(() => ({ data: { data: [] } })),
            apiClient.get('/activity-types').catch(() => ({ data: { data: [] } })),
        ]).then(([projRes, typeRes]) => {
            setProjects(projRes.data.data || []);
            setActivityTypes(typeRes.data.data || []);
        });
    }, []);

    const fetchActivities = useCallback(async (pageNum, append = false) => {
        if (!append) setLoading(true);
        else setLoadingMore(true);

        try {
            const params = { owner: 'me', page: pageNum, limit };
            if (projectFilter) params.projectId = projectFilter;
            if (typeFilter) params.type = typeFilter;

            const res = await apiClient.get('/activities', { params });
            const data = res.data?.data || res.data || [];
            const items = Array.isArray(data) ? data : (data.data || []);
            const meta = res.data?.meta || res.data?.pagination || {};
            const totalPages = meta?.lastPage || meta?.last_page || 1;

            if (append) {
                setActivities((prev) => [...prev, ...items]);
            } else {
                setActivities(items);
            }
            setHasMore(pageNum < totalPages);
        } catch {
            if (!append) setActivities([]);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [projectFilter, typeFilter]);

    useEffect(() => {
        setPage(1);
        fetchActivities(1, false);
    }, [fetchActivities]);

    function handleLoadMore() {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchActivities(nextPage, true);
    }

    function toggleExpand(id) {
        setExpandedId((prev) => (prev === id ? null : id));
    }

    function handleExportCSV() {
        setExporting(true);
        const params = new URLSearchParams({ owner: 'me', format: 'csv' });
        if (projectFilter) params.set('projectId', projectFilter);
        if (typeFilter) params.set('type', typeFilter);

        apiClient.get(`/activities?${params.toString()}`, { responseType: 'blob' })
            .then((res) => {
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'activities.csv');
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            })
            .catch(() => {})
            .finally(() => setExporting(false));
    }

    async function handleDeleteActivity(id) {
        try {
            await apiClient.delete(`/activities/${id}`);
            setActivities((prev) => prev.filter((a) => a.id !== id));
            setDeleteConfirmId(null);
            if (expandedId === id) setExpandedId(null);
        } catch {
            // silently fail
        }
    }

    async function handlePublishDocument(id) {
        try {
            await apiClient.patch(`/documents/${id}`, { published: true });
            setPublishConfirmId(null);
            setActivities((prev) =>
                prev.map((a) => ({
                    ...a,
                    documents: a.documents?.map((d) =>
                        d.id === id ? { ...d, published: true } : d
                    ) || a.documents,
                }))
            );
        } catch {
            // silently fail
        }
    }

    async function handleForwardDocument() {
        if (!forwardDocId || !forwardRecipient.trim()) return;
        try {
            await apiClient.post('/inbox/forward', {
                documentId: forwardDocId,
                recipientId: forwardRecipient.trim(),
            });
            setForwardDocId(null);
            setForwardRecipient('');
        } catch {
            // silently fail
        }
    }

    async function handleDeleteDocument(id) {
        try {
            await apiClient.delete(`/documents/${id}`);
            setDeleteDocId(null);
            setActivities((prev) =>
                prev.map((a) => ({
                    ...a,
                    documents: a.documents?.filter((d) => d.id !== id) || [],
                }))
            );
        } catch {
            // silently fail
        }
    }

    function handleUpdated(updated) {
        setActivities((prev) =>
            prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
        );
    }

    function getDocumentActions(doc) {
        return [
            { label: 'Download', action: () => window.open(`/api/documents/${doc.id}/download`, '_blank'), color: 'var(--color-primary)' },
            { label: 'Publish', action: () => setPublishConfirmId(doc.id), color: '#16a34a', hidden: doc.published },
            { label: 'Forward', action: () => setForwardDocId(doc.id), color: '#9333ea' },
            { label: 'Delete', action: () => setDeleteDocId(doc.id), color: '#dc2626' },
        ];
    }

    const containerStyle = { maxWidth: '960px', margin: '0 auto', padding: '24px 16px' };

    const filterStyle = {
        display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center',
        marginBottom: '20px', padding: '16px', backgroundColor: '#f8fafc',
        borderRadius: '8px', border: '1px solid #e2e8f0',
    };

    const inputStyle = {
        padding: '8px 12px', fontSize: '13px', border: '1px solid #e2e8f0',
        borderRadius: '6px', outline: 'none', fontFamily: 'inherit',
    };

    const selectStyle = { ...inputStyle, cursor: 'pointer', minWidth: '150px' };

    const tableStyle = { width: '100%', borderCollapse: 'collapse' };

    const thStyle = {
        textAlign: 'left', padding: '10px 12px', fontSize: '12px', fontWeight: 600,
        color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px',
        borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc',
    };

    const tdStyle = {
        padding: '10px 12px', fontSize: '13px', color: '#1e293b',
        borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
    };

    const badgeStyle = {
        display: 'inline-block', padding: '2px 8px', fontSize: '11px', fontWeight: 600,
        backgroundColor: 'var(--color-primary-bg)', color: '#1d4ed8', borderRadius: '10px',
    };

    const actionIconStyle = (color) => ({
        background: 'none', border: 'none', color, cursor: 'pointer',
        fontSize: '13px', fontWeight: 600, padding: '4px 8px',
        borderRadius: '4px', fontFamily: 'inherit',
    });

    const confirmOverlayStyle = {
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 300, padding: '20px',
    };

    const confirmBoxStyle = {
        backgroundColor: 'white', borderRadius: '10px', padding: '24px',
        maxWidth: '400px', width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    };

    const filteredActivities = activities.filter((a) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (a.description || '').toLowerCase().includes(q);
    });

    const searchedActivities = filteredActivities;

    return (
        <div style={containerStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: 0 }}>My Activities</h1>
                <button
                    type="button"
                    onClick={() => navigate('/log-activity')}
                    style={{
                        padding: '9px 20px', fontSize: '14px', fontWeight: 600,
                        color: 'white', backgroundColor: 'var(--color-primary)', border: 'none',
                        borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                >
                    + Log Activity
                </button>
            </div>

            <div style={filterStyle}>
                <input
                    type="text"
                    placeholder="Search by description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ ...inputStyle, flex: 1, minWidth: '180px' }}
                />
                <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} style={selectStyle}>
                    <option value="">All projects</option>
                    {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.title || p.name}</option>
                    ))}
                </select>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={selectStyle}>
                    <option value="">All types</option>
                    {activityTypes.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={handleExportCSV}
                    disabled={exporting}
                    style={{
                        padding: '8px 16px', fontSize: '13px', fontWeight: 500,
                        color: '#475569', backgroundColor: 'white', border: '1px solid #e2e8f0',
                        borderRadius: '6px', cursor: exporting ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit',
                    }}
                >
                    {exporting ? 'Exporting...' : 'Export CSV'}
                </button>
            </div>

            {loading && (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>Loading activities...</p>
            )}

            {!loading && searchedActivities.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                    <p style={{ fontSize: '16px', marginBottom: '16px' }}>
                        {activities.length === 0 ? 'No activities logged yet.' : 'No activities match your search.'}
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/log-activity')}
                        style={{
                            padding: '9px 20px', fontSize: '14px', fontWeight: 600,
                            color: 'white', backgroundColor: 'var(--color-primary)', border: 'none',
                            borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                    >
                        Log Activity
                    </button>
                </div>
            )}

            {!loading && searchedActivities.length > 0 && (
                <>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Date</th>
                                <th style={thStyle}>Description</th>
                                <th style={thStyle}>Project</th>
                                <th style={thStyle}>Type</th>
                                <th style={{ ...thStyle, textAlign: 'center' }}>Files</th>
                                <th style={{ ...thStyle, width: '30px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                        {searchedActivities.map((act) => (
                                    <Fragment key={act.id}>
                                        <tr onClick={() => toggleExpand(act.id)} style={{ cursor: 'pointer' }}>
                                        <td style={tdStyle}>{act.date || act.activity_date || '-'}</td>
                                        <td style={tdStyle}>{act.description}</td>
                                        <td style={tdStyle} title={act.project?.title || act.project_name || ''}>
                                            {(act.project?.title || act.project_name || '').length > 20
                                                ? (act.project?.title || act.project_name || '').slice(0, 20) + '...'
                                                : (act.project?.title || act.project_name || '')
                                            }
                                        </td>
                                        <td style={tdStyle}>{act.type?.name || act.activity_type || '-'}</td>
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                            <span style={badgeStyle}>
                                                {(act.documents?.length || act.file_count || 0)}
                                            </span>
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'center', fontSize: '16px', color: '#94a3b8' }}>
                                            {expandedId === act.id ? '▲' : '▼'}
                                        </td>
                                    </tr>
                                    {expandedId === act.id && (
                                        <tr key={`${act.id}-expanded`}>
                                            <td colSpan={6} style={{ padding: '16px 12px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                {act.notes && (
                                                    <div style={{ marginBottom: '12px' }}>
                                                        <strong style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Notes</strong>
                                                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#1e293b' }}>{act.notes}</p>
                                                    </div>
                                                )}

                                                {act.documents && act.documents.length > 0 && (
                                                    <div style={{ marginBottom: '12px' }}>
                                                        <strong style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Documents</strong>
                                                        {act.documents.map((doc) => (
                                                            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', fontSize: '13px' }}>
                                                                <span style={{ flex: 1 }}>{doc.filename || doc.name || 'Untitled'}</span>
                                                                {getDocumentActions(doc).map((btn) =>
                                                                    !btn.hidden && (
                                                                        <button
                                                                            key={btn.label}
                                                                            type="button"
                                                                            onClick={(e) => { e.stopPropagation(); btn.action(); }}
                                                                            style={actionIconStyle(btn.color)}
                                                                        >
                                                                            {btn.label}
                                                                        </button>
                                                                    )
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); setEditActivity(act); }}
                                                        style={{
                                                            padding: '6px 14px', fontSize: '13px', fontWeight: 500,
                                                            color: 'var(--color-primary)', backgroundColor: '#eff6ff',
                                                            border: '1px solid #bfdbfe', borderRadius: '6px',
                                                            cursor: 'pointer', fontFamily: 'inherit',
                                                        }}
                                                    >
                                                        Edit Activity
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(act.id); }}
                                                        style={{
                                                            padding: '6px 14px', fontSize: '13px', fontWeight: 500,
                                                            color: '#dc2626', backgroundColor: '#fef2f2',
                                                            border: '1px solid #fecaca', borderRadius: '6px',
                                                            cursor: 'pointer', fontFamily: 'inherit',
                                                        }}
                                                    >
                                                        Delete Activity
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>

                    {hasMore && (
                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <button
                                type="button"
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                style={{
                                    padding: '10px 32px', fontSize: '14px', fontWeight: 500,
                                    color: '#475569', backgroundColor: 'white',
                                    border: '1px solid #e2e8f0', borderRadius: '6px',
                                    cursor: loadingMore ? 'not-allowed' : 'pointer',
                                    fontFamily: 'inherit',
                                }}
                            >
                                {loadingMore ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Edit Modal */}
            <EditActivityModal
                isOpen={editActivity !== null}
                onClose={() => setEditActivity(null)}
                activity={editActivity}
                onUpdated={handleUpdated}
            />

            {/* Delete Confirm */}
            {deleteConfirmId && (
                <div style={confirmOverlayStyle} onClick={() => setDeleteConfirmId(null)}>
                    <div style={confirmBoxStyle} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Delete Activity</h3>
                        <p style={{ fontSize: '14px', color: '#475569', marginBottom: '20px' }}>
                            Are you sure you want to delete this activity? All associated files will also be removed.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setDeleteConfirmId(null)} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#475569', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                            <button type="button" onClick={() => handleDeleteActivity(deleteConfirmId)} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: 'white', backgroundColor: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Publish Confirm */}
            {publishConfirmId && (
                <div style={confirmOverlayStyle} onClick={() => setPublishConfirmId(null)}>
                    <div style={confirmBoxStyle} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Publish Document</h3>
                        <p style={{ fontSize: '14px', color: '#475569', marginBottom: '20px' }}>
                            Make this document publicly visible?
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setPublishConfirmId(null)} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#475569', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                            <button type="button" onClick={() => handlePublishDocument(publishConfirmId)} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: 'white', backgroundColor: '#16a34a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>Publish</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Document Confirm */}
            {deleteDocId && (
                <div style={confirmOverlayStyle} onClick={() => setDeleteDocId(null)}>
                    <div style={confirmBoxStyle} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Delete Document</h3>
                        <p style={{ fontSize: '14px', color: '#475569', marginBottom: '20px' }}>
                            Remove this document permanently?
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setDeleteDocId(null)} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#475569', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                            <button type="button" onClick={() => handleDeleteDocument(deleteDocId)} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: 'white', backgroundColor: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Forward Modal */}
            {forwardDocId && (
                <div style={confirmOverlayStyle} onClick={() => { setForwardDocId(null); setForwardRecipient(''); }}>
                    <div style={confirmBoxStyle} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Forward Document</h3>
                        <p style={{ fontSize: '14px', color: '#475569', marginBottom: '12px' }}>Enter recipient ID or email:</p>
                        <input
                            type="text"
                            value={forwardRecipient}
                            onChange={(e) => setForwardRecipient(e.target.value)}
                            placeholder="Recipient ID or email"
                            style={{
                                width: '100%', padding: '9px 12px', fontSize: '14px',
                                border: '1px solid #e2e8f0', borderRadius: '6px',
                                outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                                marginBottom: '16px',
                            }}
                        />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => { setForwardDocId(null); setForwardRecipient(''); }} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#475569', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                            <button type="button" onClick={handleForwardDocument} disabled={!forwardRecipient.trim()} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: 'white', backgroundColor: forwardRecipient.trim() ? '#9333ea' : '#d8b4fe', border: 'none', borderRadius: '6px', cursor: forwardRecipient.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>Forward</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
