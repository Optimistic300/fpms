import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/axios';

export default function ActivityTypeManager() {
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editSlug, setEditSlug] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [createName, setCreateName] = useState('');
    const [createSlug, setCreateSlug] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteError, setDeleteError] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await apiClient.get('/admin/activity-types');
            setTypes(res.data?.data || []);
        } catch {
            setError('Failed to load activity types.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    function startEdit(at) {
        setEditingId(at.id);
        setEditName(at.name);
        setEditSlug(at.slug);
    }

    async function saveEdit(id) {
        if (!editName.trim() || !editSlug.trim()) return;
        try {
            const res = await apiClient.put(`/admin/activity-types/${id}`, {
                name: editName.trim(),
                slug: editSlug.trim(),
            });
            setTypes((prev) => prev.map((t) => t.id === id ? { ...t, ...res.data?.data } : t));
            setEditingId(null);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update activity type.';
            setError(msg);
        }
    }

    function generateSlug(name) {
        return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    async function handleCreate(e) {
        e.preventDefault();
        if (!createName.trim()) return;
        const slug = createSlug.trim() || generateSlug(createName);
        try {
            const res = await apiClient.post('/admin/activity-types', {
                name: createName.trim(),
                slug,
            });
            setTypes((prev) => [...prev, res.data?.data]);
            setShowCreate(false);
            setCreateName('');
            setCreateSlug('');
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to create activity type.';
            setError(msg);
        }
    }

    async function handleDelete(id) {
        setDeleteError('');
        try {
            await apiClient.delete(`/admin/activity-types/${id}`);
            setTypes((prev) => prev.filter((t) => t.id !== id));
            setDeleteConfirm(null);
        } catch (err) {
            setDeleteError(err.response?.data?.message || 'Cannot delete activity type.');
        }
    }

    const tableStyle = {
        width: '100%', borderCollapse: 'collapse', fontSize: '14px',
    };

    const thStyle = {
        textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e2e8f0',
        color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase',
    };

    const tdStyle = {
        padding: '10px 12px', borderBottom: '1px solid #e2e8f0', color: '#1e293b',
    };

    const actionBtnStyle = {
        padding: '4px 10px', fontSize: '12px', fontWeight: 500, borderRadius: '4px',
        border: '1px solid #e2e8f0', cursor: 'pointer', fontFamily: 'inherit',
        backgroundColor: 'white', color: '#475569', marginRight: '6px',
    };

    const dangerBtnStyle = { ...actionBtnStyle, color: '#dc2626', borderColor: '#fecaca' };

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading activity types...</div>;
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: 0 }}>Activity Types</h3>
                <button type="button" onClick={() => setShowCreate(true)} style={{ padding: '7px 14px', fontSize: '13px', fontWeight: 600, color: 'white', backgroundColor: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>+ Add Type</button>
            </div>

            {error && (
                <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>{error}</div>
            )}

            {deleteError && (
                <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>{deleteError}</div>
            )}

            {types.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No activity types found.</div>
            ) : (
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Name</th>
                            <th style={thStyle}>Slug</th>
                            <th style={thStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {types.map((at) => (
                            <tr key={at.id}>
                                <td style={tdStyle}>
                                    {editingId === at.id ? (
                                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ padding: '6px 10px', fontSize: '14px', border: '1px solid #e2e8f0', borderRadius: '4px', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }} />
                                    ) : at.name}
                                </td>
                                <td style={tdStyle}>
                                    {editingId === at.id ? (
                                        <input type="text" value={editSlug} onChange={(e) => setEditSlug(e.target.value)} style={{ padding: '6px 10px', fontSize: '14px', border: '1px solid #e2e8f0', borderRadius: '4px', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }} />
                                    ) : at.slug}
                                </td>
                                <td style={tdStyle}>
                                    {editingId === at.id ? (
                                        <>
                                            <button type="button" onClick={() => saveEdit(at.id)} style={{ ...actionBtnStyle, backgroundColor: '#2563eb', color: 'white', border: 'none' }}>Save</button>
                                            <button type="button" onClick={() => setEditingId(null)} style={actionBtnStyle}>Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <button type="button" onClick={() => startEdit(at)} style={actionBtnStyle}>Edit</button>
                                            <button type="button" onClick={() => setDeleteConfirm(at.id)} style={dangerBtnStyle}>Delete</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {showCreate && (
                <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', margin: '0 0 12px' }}>New Activity Type</h4>
                    <form onSubmit={handleCreate}>
                        <input type="text" value={createName} onChange={(e) => { setCreateName(e.target.value); if (!createSlug) setCreateSlug(generateSlug(e.target.value)); }} placeholder="Activity type name" required style={{ padding: '9px 12px', fontSize: '14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'inherit', marginBottom: '10px', width: '100%', boxSizing: 'border-box' }} />
                        <input type="text" value={createSlug} onChange={(e) => setCreateSlug(e.target.value)} placeholder="slug-name" style={{ padding: '9px 12px', fontSize: '14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'inherit', marginBottom: '10px', width: '100%', boxSizing: 'border-box' }} />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '7px 14px', fontSize: '13px', fontWeight: 500, color: '#475569', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                            <button type="submit" style={{ padding: '7px 14px', fontSize: '13px', fontWeight: 600, color: 'white', backgroundColor: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>Create</button>
                        </div>
                    </form>
                </div>
            )}

            {deleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '20px' }} onClick={() => { setDeleteConfirm(null); setDeleteError(''); }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', maxWidth: '400px', width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Delete Activity Type</h3>
                        <p style={{ fontSize: '14px', color: '#475569', marginBottom: '20px' }}>Are you sure you want to delete this activity type?</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => { setDeleteConfirm(null); setDeleteError(''); }} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#475569', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                            <button type="button" onClick={() => handleDelete(deleteConfirm)} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: 'white', backgroundColor: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
