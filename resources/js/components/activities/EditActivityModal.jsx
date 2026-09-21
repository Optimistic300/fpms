import { useState, useEffect } from 'react';
import apiClient from '../../api/axios';

export default function EditActivityModal({ isOpen, onClose, activity, onUpdated }) {
    const [form, setForm] = useState({ description: '', notes: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (activity) {
            setForm({
                description: activity.description || '',
                notes: activity.notes || '',
            });
            setError('');
        }
    }, [activity]);

    if (!isOpen || !activity) return null;

    function handleChange(field, value) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!form.description.trim()) {
            setError('Description is required.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await apiClient.put(`/activities/${activity.id}`, {
                description: form.description.trim(),
                notes: form.notes.trim() || undefined,
            });
            onUpdated(res.data.data || res.data);
            onClose();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update activity.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    }

    const overlayStyle = {
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: '20px',
    };
    const modalStyle = {
        backgroundColor: 'white', borderRadius: '10px', maxWidth: '480px',
        width: '100%', maxHeight: '90vh', overflowY: 'auto',
        padding: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    };
    const inputStyle = {
        width: '100%', padding: '9px 12px', fontSize: '14px',
        border: '1px solid #e2e8f0', borderRadius: '6px', outline: 'none',
        fontFamily: 'inherit', boxSizing: 'border-box',
    };
    const labelStyle = { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 600, color: '#374151' };

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Edit activity">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Edit Activity</h2>
                    <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8', padding: '4px' }} aria-label="Close">✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Description *</label>
                        <input type="text" value={form.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Activity description" style={inputStyle} />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Notes</label>
                        <textarea value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} placeholder="Optional notes" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                    </div>

                    {error && (
                        <div style={{ color: '#dc2626', fontSize: '14px', marginBottom: '16px', padding: '8px 12px', backgroundColor: '#fef2f2', borderRadius: '6px' }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} disabled={submitting} style={{ padding: '9px 20px', fontSize: '14px', fontWeight: 500, color: '#475569', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} style={{ padding: '9px 20px', fontSize: '14px', fontWeight: 600, color: 'white', backgroundColor: submitting ? 'var(--color-primary-lighter)' : 'var(--color-primary)', border: 'none', borderRadius: '6px', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                            {submitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
