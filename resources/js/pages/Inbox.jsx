import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import { useNotification } from '../contexts/NotificationContext';

const TABS = [
    { key: '', label: 'All' },
    { key: 'DOCUMENT', label: 'Documents' },
    { key: 'REPORT_UPDATE', label: 'Report updates' },
    { key: 'SYSTEM', label: 'System alerts' },
];

function formatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function Inbox() {
    const { refreshCount } = useNotification();
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({ unreadCount: 0, total: 0, currentPage: 1, lastPage: 1 });
    const [activeTab, setActiveTab] = useState('');
    const [filterUnread, setFilterUnread] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [expandedId, setExpandedId] = useState(null);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [forwardDocumentId, setForwardDocumentId] = useState(null);
    const [userSearch, setUserSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedRecipients, setSelectedRecipients] = useState([]);
    const [forwardMessage, setForwardMessage] = useState('');
    const [forwarding, setForwarding] = useState(false);
    const [page, setPage] = useState(1);

    const fetchItems = useCallback(async (p = page) => {
        setLoading(true);
        try {
            const params = { page: p, limit: 20 };
            if (activeTab) params.type = activeTab;
            if (filterUnread) params.read = false;
            const res = await apiClient.get('/inbox', { params });
            const data = res.data;
            const itemsData = data.data || [];
            setItems(itemsData);
            setMeta(data.meta || { unreadCount: 0, total: 0, currentPage: 1, lastPage: 1 });
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [activeTab, filterUnread, page]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    useEffect(() => {
        setPage(1);
    }, [activeTab, filterUnread]);

    const tabCounts = useCallback(async () => {
        try {
            const res = await apiClient.get('/inbox', { params: { page: 1, limit: 1 } });
            if (res.data?.meta) {
                setMeta(prev => ({ ...prev, unreadCount: res.data.meta.unreadCount }));
            }
        } catch { /* ignore */ }
    }, []);

    const handleMarkRead = async (id) => {
        try {
            await apiClient.patch(`/inbox/${id}/read`);
            setItems(prev => prev.map(i => i.id === id ? { ...i, read: true } : i));
            refreshCount();
            tabCounts();
        } catch { /* ignore */ }
    };

    const handleMarkAllRead = async () => {
        const ids = selectedIds.size > 0 ? [...selectedIds] : undefined;
        try {
            await apiClient.patch('/inbox/read-all', ids ? { ids } : {});
            setItems(prev => prev.map(i => ({ ...i, read: true })));
            setSelectedIds(new Set());
            refreshCount();
            tabCounts();
        } catch { /* ignore */ }
    };

    const handleBulkMarkRead = async () => {
        if (selectedIds.size === 0) return;
        try {
            await apiClient.patch('/inbox/read-all', { ids: [...selectedIds] });
            setItems(prev => prev.map(i => selectedIds.has(i.id) ? { ...i, read: true } : i));
            setSelectedIds(new Set());
            refreshCount();
            tabCounts();
        } catch { /* ignore */ }
    };

    const handleItemClick = (item) => {
        if ((item.type === 'REPORT_UPDATE' || item.type === 'SYSTEM') && item.reportId) {
            if (!item.read) handleMarkRead(item.id);
            navigate(`/reports/${item.reportId}`);
        } else if (item.type === 'DOCUMENT') {
            setExpandedId(expandedId === item.id ? null : item.id);
        }
    };

    const handleForwardClick = (documentId) => {
        setForwardDocumentId(documentId);
        setUserSearch('');
        setSearchResults([]);
        setSelectedRecipients([]);
        setForwardMessage('');
        setShowForwardModal(true);
    };

    const handleUserSearch = async (query) => {
        setUserSearch(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const res = await apiClient.get('/users', { params: { search: query, limit: 10 } });
            const users = res.data?.data || [];
            setSearchResults(users.filter(u => !selectedRecipients.find(r => r.id === u.id)));
        } catch { /* ignore */ }
    };

    const addRecipient = (user) => {
        setSelectedRecipients(prev => [...prev, user]);
        setUserSearch('');
        setSearchResults([]);
    };

    const removeRecipient = (userId) => {
        setSelectedRecipients(prev => prev.filter(r => r.id !== userId));
    };

    const submitForward = async () => {
        if (selectedRecipients.length === 0 || !forwardDocumentId) return;
        setForwarding(true);
        try {
            await apiClient.post('/inbox/forward', {
                documentId: forwardDocumentId,
                recipientIds: selectedRecipients.map(r => r.id),
                message: forwardMessage || undefined,
            });
            setShowForwardModal(false);
            refreshCount();
            tabCounts();
        } catch { /* ignore */ }
        setForwarding(false);
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === items.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(items.map(i => i.id)));
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a365d', margin: '0 0 4px' }}>
                    Inbox
                    {meta.unreadCount > 0 && (
                        <span style={{
                            marginLeft: '12px',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#e53e3e',
                            verticalAlign: 'middle',
                        }}>
                            {meta.unreadCount} unread
                        </span>
                    )}
                </h1>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                    Notifications from forwarded documents, report updates, and system alerts
                </p>
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                borderBottom: '1px solid #e2e8f0',
                marginBottom: '16px',
            }}>
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            padding: '10px 16px',
                            fontSize: '14px',
                            fontWeight: activeTab === tab.key ? 600 : 400,
                            color: activeTab === tab.key ? '#2b6cb0' : '#64748b',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab.key ? '2px solid #2b6cb0' : '2px solid transparent',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setFilterUnread(!filterUnread)}
                        style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: filterUnread ? '#2b6cb0' : '#64748b',
                            background: filterUnread ? '#ebf4ff' : 'transparent',
                            border: '1px solid',
                            borderColor: filterUnread ? '#2b6cb0' : '#e2e8f0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                        }}
                    >
                        {filterUnread ? '✓ Unread only' : 'Filter unread'}
                    </button>
                    <button
                        onClick={handleMarkAllRead}
                        style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#64748b',
                            background: 'transparent',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                        }}
                    >
                        Mark all read
                    </button>
                </div>
            </div>

            {selectedIds.size > 0 && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 16px',
                    backgroundColor: '#ebf8ff',
                    border: '1px solid #bee3f8',
                    borderRadius: '8px',
                    marginBottom: '12px',
                }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#2b6cb0' }}>
                        {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
                    </span>
                    <button onClick={handleBulkMarkRead} style={actionBtnStyle}>
                        Mark read
                    </button>
                    <button
                        onClick={() => {
                            const docs = items.filter(i => selectedIds.has(i.id) && i.documentId);
                            if (docs.length > 0) {
                                docs.forEach(d => {
                                    window.open(`/api/documents/${d.documentId}/download`, '_blank');
                                });
                            }
                        }}
                        style={actionBtnStyle}
                    >
                        Download all
                    </button>
                    <button onClick={() => setSelectedIds(new Set())} style={actionBtnStyle}>
                        Deselect
                    </button>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Loading...</div>
            ) : items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                    No items in your inbox
                </div>
            ) : (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px 8px' }}>
                        <input
                            type="checkbox"
                            checked={selectedIds.size === items.length && items.length > 0}
                            onChange={toggleSelectAll}
                            style={{ marginRight: '12px' }}
                        />
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                            {meta.total} item{meta.total !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {items.map(item => {
                        const isSelected = selectedIds.has(item.id);
                        const isExpanded = expandedId === item.id;
                        return (
                            <div key={item.id}>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        padding: '12px 16px',
                                        borderLeft: item.read ? '3px solid transparent' : '3px solid #2b6cb0',
                                        backgroundColor: isSelected ? '#f7fafc' : 'transparent',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.1s',
                                    }}
                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                    <div
                                        style={{ marginRight: '12px', paddingTop: '2px' }}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelect(item.id)}
                                        />
                                    </div>
                                    <div
                                        style={{ flex: 1, minWidth: 0 }}
                                        onClick={() => {
                                            if (item.type === 'DOCUMENT') {
                                                setExpandedId(isExpanded ? null : item.id);
                                                if (!item.read) handleMarkRead(item.id);
                                            } else {
                                                handleItemClick(item);
                                            }
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                color: typeColor(item.type),
                                                backgroundColor: typeBg(item.type),
                                                padding: '1px 6px',
                                                borderRadius: '4px',
                                                textTransform: 'uppercase',
                                            }}>
                                                {typeLabel(item.type)}
                                            </span>
                                            {!item.read && (
                                                <span style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#2b6cb0',
                                                    flexShrink: 0,
                                                }} />
                                            )}
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            fontWeight: item.read ? 400 : 600,
                                            color: '#1a202c',
                                            marginBottom: '2px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {item.subject}
                                        </div>
                                        <div style={{
                                            fontSize: '13px',
                                            color: '#718096',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            marginBottom: '4px',
                                        }}>
                                            {item.message || 'No additional details'}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#a0aec0' }}>
                                            <span>
                                                {item.sender
                                                    ? `${item.sender.fullName} · ${item.sender.division || 'No division'}`
                                                    : 'SKMS · System'
                                                }
                                            </span>
                                            <span>·</span>
                                            <span>{formatTime(item.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                {isExpanded && item.type === 'DOCUMENT' && item.documentId && (
                                    <div style={{
                                        marginLeft: '48px',
                                        padding: '16px',
                                        backgroundColor: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        marginBottom: '8px',
                                    }}>
                                        <div style={{ fontSize: '13px', color: '#4a5568', marginBottom: '12px' }}>
                                            {item.message || 'No message'}
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 12px',
                                            backgroundColor: 'white',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '6px',
                                            marginBottom: '12px',
                                        }}>
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                color: '#2b6cb0',
                                                backgroundColor: '#ebf4ff',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                            }}>
                                                DOC
                                            </span>
                                            <span style={{ fontSize: '13px', color: '#2d3748' }}>Document #{item.documentId}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <a
                                                href={`/api/documents/${item.documentId}/download`}
                                                style={inlineActionBtnStyle}
                                                onClick={e => e.stopPropagation()}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Download
                                            </a>
                                            <button
                                                onClick={e => { e.stopPropagation(); handleForwardClick(item.documentId); }}
                                                style={inlineActionBtnStyle}
                                            >
                                                Forward
                                            </button>
                                            {!item.read && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); handleMarkRead(item.id); }}
                                                    style={inlineActionBtnStyle}
                                                >
                                                    Mark read
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {meta.lastPage > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '24px 0' }}>
                            <button
                                disabled={meta.currentPage <= 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                style={paginationBtnStyle(meta.currentPage <= 1)}
                            >
                                Previous
                            </button>
                            <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: '#64748b' }}>
                                Page {meta.currentPage} of {meta.lastPage}
                            </span>
                            <button
                                disabled={meta.currentPage >= meta.lastPage}
                                onClick={() => setPage(p => Math.min(meta.lastPage, p + 1))}
                                style={paginationBtnStyle(meta.currentPage >= meta.lastPage)}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            {showForwardModal && (
                <div
                    style={{
                        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000,
                    }}
                    onClick={() => setShowForwardModal(false)}
                >
                    <div
                        style={{
                            backgroundColor: 'white', borderRadius: '12px', padding: '24px',
                            width: '480px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1a365d', margin: '0 0 16px' }}>
                            Forward Document
                        </h2>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>
                                Search recipients
                            </label>
                            <input
                                type="text"
                                value={userSearch}
                                onChange={e => handleUserSearch(e.target.value)}
                                placeholder="Type to search users..."
                                style={{
                                    width: '100%', padding: '8px 12px', fontSize: '14px',
                                    border: '1px solid #e2e8f0', borderRadius: '6px',
                                    outline: 'none', boxSizing: 'border-box',
                                }}
                            />
                            {searchResults.length > 0 && (
                                <div style={{
                                    border: '1px solid #e2e8f0', borderRadius: '6px',
                                    marginTop: '4px', maxHeight: '160px', overflowY: 'auto',
                                }}>
                                    {searchResults.map(user => (
                                        <div
                                            key={user.id}
                                            onClick={() => addRecipient(user)}
                                            style={{
                                                padding: '8px 12px', cursor: 'pointer', fontSize: '14px',
                                                borderBottom: '1px solid #f1f5f9',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f7fafc'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <span style={{ fontWeight: 500 }}>{user.fullName || user.name}</span>
                                            <span style={{ color: '#a0aec0', marginLeft: '8px', fontSize: '12px' }}>
                                                {user.role} · {user.division || ''}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {userSearch.length >= 2 && searchResults.length === 0 && (
                                <div style={{ fontSize: '13px', color: '#a0aec0', padding: '8px 0' }}>
                                    No users found matching '{userSearch}'
                                </div>
                            )}
                        </div>

                        {selectedRecipients.length > 0 && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>
                                    Recipients ({selectedRecipients.length})
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {selectedRecipients.map(user => (
                                        <span key={user.id} style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                            padding: '4px 8px', backgroundColor: '#ebf4ff',
                                            border: '1px solid #bee3f8', borderRadius: '16px',
                                            fontSize: '12px', color: '#2b6cb0',
                                        }}>
                                            {user.fullName || user.name}
                                            <button
                                                onClick={() => removeRecipient(user.id)}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    fontSize: '14px', color: '#2b6cb0', padding: '0 2px',
                                                }}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>
                                Message (optional)
                            </label>
                            <textarea
                                value={forwardMessage}
                                onChange={e => setForwardMessage(e.target.value)}
                                rows={3}
                                placeholder="Add a message..."
                                style={{
                                    width: '100%', padding: '8px 12px', fontSize: '14px',
                                    border: '1px solid #e2e8f0', borderRadius: '6px',
                                    outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                                    fontFamily: 'inherit',
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                                onClick={() => setShowForwardModal(false)}
                                style={{
                                    padding: '8px 16px', fontSize: '14px', color: '#64748b',
                                    background: 'white', border: '1px solid #e2e8f0',
                                    borderRadius: '6px', cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitForward}
                                disabled={selectedRecipients.length === 0 || forwarding}
                                style={{
                                    padding: '8px 16px', fontSize: '14px', fontWeight: 600,
                                    color: 'white', background: selectedRecipients.length === 0 ? '#a0aec0' : '#2b6cb0',
                                    border: 'none', borderRadius: '6px', cursor: selectedRecipients.length === 0 ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {forwarding ? 'Forwarding...' : `Forward to ${selectedRecipients.length} recipient${selectedRecipients.length !== 1 ? 's' : ''}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function typeColor(type) {
    switch (type) {
        case 'DOCUMENT': return '#2b6cb0';
        case 'REPORT_UPDATE': return '#2f855a';
        case 'SYSTEM': return '#d69e2e';
        default: return '#718096';
    }
}

function typeBg(type) {
    switch (type) {
        case 'DOCUMENT': return '#ebf4ff';
        case 'REPORT_UPDATE': return '#f0fff4';
        case 'SYSTEM': return '#fffff0';
        default: return '#f7fafc';
    }
}

function typeLabel(type) {
    switch (type) {
        case 'DOCUMENT': return 'Document';
        case 'REPORT_UPDATE': return 'Report';
        case 'SYSTEM': return 'System';
        default: return type;
    }
}

const actionBtnStyle = {
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#2b6cb0',
    backgroundColor: 'transparent',
    border: '1px solid #bee3f8',
    borderRadius: '4px',
    cursor: 'pointer',
};

const inlineActionBtnStyle = {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#2b6cb0',
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
};

function paginationBtnStyle(disabled) {
    return {
        padding: '6px 12px',
        fontSize: '13px',
        color: disabled ? '#cbd5e0' : '#2b6cb0',
        background: 'white',
        border: '1px solid',
        borderColor: disabled ? '#e2e8f0' : '#bee3f8',
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
    };
}
