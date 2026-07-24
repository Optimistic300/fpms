import { useState, useEffect } from 'react';
import apiClient from '../../api/axios';

const ROLES = ['RESEARCHER', 'STUDENT', 'SECRETARY', 'DIVISION_HEAD', 'MANAGEMENT', 'ADMIN'];

export default function UserFormModal({ isOpen, onClose, user, onSaved }) {
    const [form, setForm] = useState({
        email: '', fullName: '', role: 'RESEARCHER', divisionId: '', password: '',
    });
    const [divisions, setDivisions] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const isEditing = !!user;

    useEffect(() => {
        if (isOpen) {
            apiClient.get('/admin/divisions').then((res) => {
                setDivisions(res.data?.data || []);
            }).catch(() => {});
        }
    }, [isOpen]);

    useEffect(() => {
        if (user) {
            setForm({
                email: user.email || '',
                fullName: user.fullName || '',
                role: user.role || 'RESEARCHER',
                divisionId: user.divisionId ?? '',
                password: '',
            });
        } else {
            setForm({ email: '', fullName: '', role: 'RESEARCHER', divisionId: '', password: '' });
        }
        setError('');
    }, [user, isOpen]);

    if (!isOpen) return null;

    function handleChange(field, value) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!form.email.trim() || !form.fullName.trim()) {
            setError('Email and Full Name are required.');
            return;
        }
        if (!isEditing && !form.password) {
            setError('Password is required for new users.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                email: form.email.trim(),
                fullName: form.fullName.trim(),
                role: form.role,
                divisionId: form.divisionId ? Number(form.divisionId) : null,
            };
            if (form.password) {
                payload.password = form.password;
            }

            let res;
            if (isEditing) {
                res = await apiClient.put(`/admin/users/${user.userId}`, payload);
            } else {
                res = await apiClient.post('/admin/users', payload);
            }

            onSaved(res.data?.data || res.data);
            onClose();
        } catch (err) {
            const msg = err.response?.data?.message
                || err.response?.data?.errors?.[Object.keys(err.response?.data?.errors || {})[0]]?.[0]
                || 'Failed to save user.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    }

    const overlayStyle = {
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 300, padding: '20px',
    };

    const modalStyle = {
        backgroundColor: 'white', borderRadius: '10px', padding: '24px',
        maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    };

    const labelStyle = {
        display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151',
        marginBottom: '4px', marginTop: '12px',
    };

    const inputStyle = {
        width: '100%', padding: '9px 12px', fontSize: '14px',
        border: '1px solid #e2e8f0', borderRadius: '6px',
        outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    };

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                        {isEditing ? 'Edit User' : 'Create User'}
                    </h2>
                    <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8', fontFamily: 'inherit' }}>×</button>
                </div>

                {error && (
                    <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>{error}</div>
                )}

                <form onSubmit={handleSubmit}>
                    <label htmlFor="user-email" style={labelStyle}>Email *</label>
                    <input id="user-email" type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} style={inputStyle} placeholder="user@forig.org" />

                    <label htmlFor="user-fullname" style={labelStyle}>Full Name *</label>
                    <input id="user-fullname" type="text" value={form.fullName} onChange={(e) => handleChange('fullName', e.target.value)} style={inputStyle} placeholder="John Doe" />

                    <label htmlFor="user-role" style={labelStyle}>Role *</label>
                    <select id="user-role" value={form.role} onChange={(e) => handleChange('role', e.target.value)} style={inputStyle}>
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>

                    <label htmlFor="user-division" style={labelStyle}>Division</label>
                    <select id="user-division" value={form.divisionId} onChange={(e) => handleChange('divisionId', e.target.value)} style={inputStyle}>
                        <option value="">-- None --</option>
                        {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>

                    <label htmlFor="user-password" style={labelStyle}>{isEditing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                    <input id="user-password" type="password" value={form.password} onChange={(e) => handleChange('password', e.target.value)} style={inputStyle} placeholder="Min. 8 characters" />

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button type="button" onClick={onClose} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#475569', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                        <button type="submit" disabled={submitting} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: 'white', backgroundColor: submitting ? '#93c5fd' : '#2563eb', border: 'none', borderRadius: '6px', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{submitting ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
