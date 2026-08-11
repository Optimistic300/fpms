import { useState } from 'react';
import apiClient from '../../api/axios';

export default function ForwardModal({ documentId, onClose }) {
    const [userSearch, setUserSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedRecipients, setSelectedRecipients] = useState([]);
    const [message, setMessage] = useState('');
    const [forwarding, setForwarding] = useState(false);
    const [error, setError] = useState('');

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
        } catch {
            setSearchResults([]);
        }
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
        if (selectedRecipients.length === 0 || !documentId) return;
        setForwarding(true);
        setError('');
        try {
            await apiClient.post('/inbox/forward', {
                documentId,
                recipientIds: selectedRecipients.map(r => r.id),
                message: message || undefined,
            });
            onClose(true);
        } catch {
            setError('Failed to forward document. Please try again.');
        }
        setForwarding(false);
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000,
            }}
            onClick={() => onClose(false)}
        >
            <div
                style={{
                    backgroundColor: 'white', borderRadius: '12px', padding: '24px',
                    width: '480px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto',
                }}
                onClick={e => e.stopPropagation()}
            >
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-brand-dark)', margin: '0 0 16px' }}>
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
                                    fontSize: '12px', color: 'var(--color-primary)',
                                }}>
                                    {user.fullName || user.name}
                                    <button
                                        onClick={() => removeRecipient(user.id)}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            fontSize: '14px', color: 'var(--color-primary)', padding: '0 2px',
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
                        value={message}
                        onChange={e => setMessage(e.target.value)}
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

                {error && (
                    <div style={{
                        padding: '8px 12px', backgroundColor: '#fff5f5', color: '#e53e3e',
                        border: '1px solid #fed7d7', borderRadius: '6px', fontSize: '13px',
                        marginBottom: '16px',
                    }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                        onClick={() => onClose(false)}
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
                            color: 'white', background: selectedRecipients.length === 0 ? '#a0aec0' : 'var(--color-primary)',
                            border: 'none', borderRadius: '6px',
                            cursor: selectedRecipients.length === 0 ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {forwarding ? 'Forwarding...' : `Forward to ${selectedRecipients.length} recipient${selectedRecipients.length !== 1 ? 's' : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
