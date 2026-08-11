import { useState } from 'react';
import apiClient from '../../api/axios';

export default function AddPublicationModal({ isOpen, onClose, onCreated }) {
    const [form, setForm] = useState({
        title: '', authors: '', type: 'PAPER', status: 'DRAFT',
        journalName: '', linkedProjectId: '', doi: '',
        studentName: '', supervisor: '', degreeProgramme: '',
    });
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    function handleChange(field, value) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!form.title.trim() || !form.authors.trim()) {
            setError('Title and Authors are required.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = { ...form };
            if (payload.linkedProjectId) {
                payload.linkedProjectId = Number(payload.linkedProjectId);
            } else {
                delete payload.linkedProjectId;
            }
            if (payload.status !== 'PUBLISHED') {
                delete payload.doi;
            }
            if (payload.type !== 'STUDENT') {
                delete payload.studentName;
                delete payload.supervisor;
                delete payload.degreeProgramme;
            }

            const data = new FormData();
            Object.entries(payload).forEach(([key, val]) => {
                if (val !== undefined && val !== null && val !== '') {
                    data.append(key, val);
                }
            });
            if (file) {
                data.append('manuscriptFile', file);
            }

            const res = await apiClient.post('/publications', data, {
                headers: file ? { 'Content-Type': 'multipart/form-data' } : {},
            });
            const created = res.data?.data || res.data;
            onCreated(created);
            onClose();
            setForm({
                title: '', authors: '', type: 'PAPER', status: 'DRAFT',
                journalName: '', linkedProjectId: '', doi: '',
                studentName: '', supervisor: '', degreeProgramme: '',
            });
            setFile(null);
        } catch (err) {
            const msg = err.response?.data?.message
                || err.response?.data?.errors?.[Object.keys(err.response?.data?.errors || {})[0]]?.[0]
                || 'Failed to create publication.';
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
        maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
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

    const rowStyle = {
        display: 'flex', gap: '12px',
    };

    const halfInputStyle = { ...inputStyle, flex: 1 };

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Add Publication</h2>
                    <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8', fontFamily: 'inherit' }}>×</button>
                </div>

                {error && (
                    <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <label htmlFor="add-title" style={labelStyle}>Title *</label>
                    <input id="add-title" type="text" value={form.title} onChange={(e) => handleChange('title', e.target.value)} style={inputStyle} placeholder="Full paper title" />

                    <label htmlFor="add-authors" style={labelStyle}>Authors *</label>
                    <input id="add-authors" type="text" value={form.authors} onChange={(e) => handleChange('authors', e.target.value)} style={inputStyle} placeholder="Comma-separated names" />

                    <div style={rowStyle}>
                        <div style={{ flex: 1 }}>
                            <label htmlFor="add-type" style={labelStyle}>Type</label>
                            <select id="add-type" value={form.type} onChange={(e) => handleChange('type', e.target.value)} style={inputStyle}>
                                <option value="PAPER">Paper</option>
                                <option value="THESIS">Thesis</option>
                                <option value="REPORT">Report</option>
                                <option value="STUDENT">CCST Student Work</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label htmlFor="add-status" style={labelStyle}>Status</label>
                            <select id="add-status" value={form.status} onChange={(e) => handleChange('status', e.target.value)} style={inputStyle}>
                                <option value="DRAFT">Draft</option>
                                <option value="SUBMITTED">Submitted</option>
                                <option value="IN_REVISION">In Revision</option>
                                <option value="PUBLISHED">Published</option>
                            </select>
                        </div>
                    </div>

                    <label htmlFor="add-journal" style={labelStyle}>Journal / Venue</label>
                    <input id="add-journal" type="text" value={form.journalName} onChange={(e) => handleChange('journalName', e.target.value)} style={inputStyle} placeholder="Journal name or target journal" />

                    {form.status === 'PUBLISHED' && (
                        <>
                            <label htmlFor="add-doi" style={labelStyle}>DOI</label>
                            <input id="add-doi" type="text" value={form.doi} onChange={(e) => handleChange('doi', e.target.value)} style={inputStyle} placeholder="10.xxxx/xxxxx" />
                        </>
                    )}

                    {form.type === 'STUDENT' && (
                        <>
                            <label htmlFor="add-student-name" style={labelStyle}>Student Name</label>
                            <input id="add-student-name" type="text" value={form.studentName} onChange={(e) => handleChange('studentName', e.target.value)} style={inputStyle} />
                            <label htmlFor="add-supervisor" style={labelStyle}>Supervisor</label>
                            <input id="add-supervisor" type="text" value={form.supervisor} onChange={(e) => handleChange('supervisor', e.target.value)} style={inputStyle} />
                            <label htmlFor="add-degree" style={labelStyle}>Degree Programme</label>
                            <input id="add-degree" type="text" value={form.degreeProgramme} onChange={(e) => handleChange('degreeProgramme', e.target.value)} style={inputStyle} />
                        </>
                    )}

                    <label htmlFor="add-manuscript" style={labelStyle}>Manuscript File</label>
                    <input id="add-manuscript" type="file" onChange={(e) => setFile(e.target.files[0] || null)} style={inputStyle} accept=".pdf,.doc,.docx" />

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button type="button" onClick={onClose} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#475569', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                        <button type="submit" disabled={submitting} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: 'white', backgroundColor: submitting ? 'var(--color-primary-lighter)' : 'var(--color-primary)', border: 'none', borderRadius: '6px', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{submitting ? 'Saving...' : 'Create Publication'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
