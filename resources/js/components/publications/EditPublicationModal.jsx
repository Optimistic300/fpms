import { useState, useEffect } from 'react';
import apiClient from '../../api/axios';

export default function EditPublicationModal({ isOpen, onClose, publication, onUpdated }) {
    const [form, setForm] = useState({
        title: '', authors: '', type: 'PAPER', status: 'DRAFT',
        journalName: '', linkedProjectId: '', doi: '',
        studentName: '', supervisor: '', degreeProgramme: '',
        submissionDate: '', revisionDueDate: '',
    });
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (publication) {
            setForm({
                title: publication.title || '',
                authors: publication.authors || '',
                type: publication.type || 'PAPER',
                status: publication.status || 'DRAFT',
                journalName: publication.journalName || '',
                linkedProjectId: publication.linkedProjectId || '',
                doi: publication.doi || '',
                studentName: publication.studentName || '',
                supervisor: publication.supervisor || '',
                degreeProgramme: publication.degreeProgramme || '',
                submissionDate: publication.submissionDate || '',
                revisionDueDate: publication.revisionDueDate || '',
            });
            setFile(null);
            setError('');
        }
    }, [publication]);

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
            if (payload.status !== 'IN_REVISION') {
                delete payload.revisionDueDate;
            }
            if (payload.status !== 'SUBMITTED' && payload.status !== 'IN_REVISION') {
                delete payload.submissionDate;
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
            data.append('_method', 'PUT');

            const res = await apiClient.post(`/publications/${publication.id}`, data, {
                headers: file ? { 'Content-Type': 'multipart/form-data' } : {},
            });
            const updated = res.data?.data || res.data;
            onUpdated(updated);
            onClose();
        } catch (err) {
            const msg = err.response?.data?.message
                || err.response?.data?.errors?.[Object.keys(err.response?.data?.errors || {})[0]]?.[0]
                || 'Failed to update publication.';
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

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Edit Publication</h2>
                    <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8', fontFamily: 'inherit' }}>×</button>
                </div>

                {error && (
                    <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <label htmlFor="edit-title" style={labelStyle}>Title *</label>
                    <input id="edit-title" type="text" value={form.title} onChange={(e) => handleChange('title', e.target.value)} style={inputStyle} />

                    <label htmlFor="edit-authors" style={labelStyle}>Authors *</label>
                    <input id="edit-authors" type="text" value={form.authors} onChange={(e) => handleChange('authors', e.target.value)} style={inputStyle} />

                    <div style={rowStyle}>
                        <div style={{ flex: 1 }}>
                            <label htmlFor="edit-type" style={labelStyle}>Type</label>
                            <select id="edit-type" value={form.type} onChange={(e) => handleChange('type', e.target.value)} style={inputStyle}>
                                <option value="PAPER">Paper</option>
                                <option value="THESIS">Thesis</option>
                                <option value="REPORT">Report</option>
                                <option value="STUDENT">CCST Student Work</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label htmlFor="edit-status" style={labelStyle}>Status</label>
                            <select id="edit-status" value={form.status} onChange={(e) => handleChange('status', e.target.value)} style={inputStyle}>
                                <option value="DRAFT">Draft</option>
                                <option value="SUBMITTED">Submitted</option>
                                <option value="IN_REVISION">In Revision</option>
                                <option value="PUBLISHED">Published</option>
                            </select>
                        </div>
                    </div>

                    <label htmlFor="edit-journal" style={labelStyle}>Journal / Venue</label>
                    <input id="edit-journal" type="text" value={form.journalName} onChange={(e) => handleChange('journalName', e.target.value)} style={inputStyle} />

                    {form.status === 'PUBLISHED' && (
                        <label htmlFor="edit-doi" style={labelStyle}>
                            DOI
                            <input id="edit-doi" type="text" value={form.doi} onChange={(e) => handleChange('doi', e.target.value)} style={inputStyle} placeholder="10.xxxx/xxxxx" />
                        </label>
                    )}

                    {(form.status === 'SUBMITTED' || form.status === 'IN_REVISION') && (
                        <label htmlFor="edit-submission-date" style={labelStyle}>
                            Submission Date
                            <input id="edit-submission-date" type="date" value={form.submissionDate} onChange={(e) => handleChange('submissionDate', e.target.value)} style={inputStyle} />
                        </label>
                    )}

                    {form.status === 'IN_REVISION' && (
                        <label htmlFor="edit-revision-due" style={labelStyle}>
                            Revision Due Date
                            <input id="edit-revision-due" type="date" value={form.revisionDueDate} onChange={(e) => handleChange('revisionDueDate', e.target.value)} style={inputStyle} />
                        </label>
                    )}

                    {form.type === 'STUDENT' && (
                        <>
                            <label htmlFor="edit-student-name" style={labelStyle}>Student Name</label>
                            <input id="edit-student-name" type="text" value={form.studentName} onChange={(e) => handleChange('studentName', e.target.value)} style={inputStyle} />
                            <label htmlFor="edit-supervisor" style={labelStyle}>Supervisor</label>
                            <input id="edit-supervisor" type="text" value={form.supervisor} onChange={(e) => handleChange('supervisor', e.target.value)} style={inputStyle} />
                            <label htmlFor="edit-degree" style={labelStyle}>Degree Programme</label>
                            <input id="edit-degree" type="text" value={form.degreeProgramme} onChange={(e) => handleChange('degreeProgramme', e.target.value)} style={inputStyle} />
                        </>
                    )}

                    <label htmlFor="edit-manuscript" style={labelStyle}>Manuscript File</label>
                    <input id="edit-manuscript" type="file" onChange={(e) => setFile(e.target.files[0] || null)} style={inputStyle} accept=".pdf,.doc,.docx" />

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button type="button" onClick={onClose} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#475569', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                        <button type="submit" disabled={submitting} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: 'white', backgroundColor: submitting ? '#93c5fd' : '#2563eb', border: 'none', borderRadius: '6px', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{submitting ? 'Saving...' : 'Save Changes'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
