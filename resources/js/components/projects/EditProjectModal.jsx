import { useState } from 'react';
import apiClient from '../../api/axios';

const fundingOptions = ['DONOR', 'GOVERNMENT', 'INTERNAL'];

export default function EditProjectModal({ isOpen, onClose, project, onUpdated }) {
    const [form, setForm] = useState({
        title: project?.title || '',
        fundingType: project?.fundingType || '',
        researchArea: project?.researchArea || '',
        location: project?.location || '',
        startDate: project?.startDate || '',
        endDate: project?.endDate || '',
        description: project?.description || '',
    });
    const [errors, setErrors] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');

    if (!isOpen) return null;

    function handleChange(field, value) {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors?.[field]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return Object.keys(next).length ? next : null;
            });
        }
    }

    function validate() {
        const errs = {};
        if (!form.title.trim()) errs.title = 'Title is required.';
        if (!form.startDate) errs.startDate = 'Start date is required.';
        return Object.keys(errs).length ? errs : null;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setServerError('');

        const validationErrors = validate();
        if (validationErrors) {
            setErrors(validationErrors);
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                title: form.title.trim(),
                fundingType: form.fundingType || undefined,
                researchArea: form.researchArea.trim() || undefined,
                location: form.location.trim() || undefined,
                startDate: form.startDate,
                endDate: form.endDate || undefined,
                description: form.description.trim() || undefined,
            };
            const response = await apiClient.put(`/projects/${project.id}`, payload);
            onUpdated(response.data.data);
            onClose();
        } catch (err) {
            const status = err.response?.status;
            const data = err.response?.data;
            if (status === 422 && data?.errors) {
                setErrors(
                    Object.fromEntries(
                        Object.entries(data.errors).map(([key, msgs]) => [key, msgs.join(', ')])
                    )
                );
            } else {
                setServerError(data?.message || 'Failed to update project. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    }

    const overlayStyle = {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '20px',
    };

    const modalStyle = {
        backgroundColor: 'white',
        borderRadius: '10px',
        maxWidth: '560px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    };

    const inputStyle = {
        width: '100%',
        padding: '9px 12px',
        fontSize: '14px',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        outline: 'none',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '5px',
        fontSize: '13px',
        fontWeight: 600,
        color: '#374151',
    };

    const errorTextStyle = {
        color: '#dc2626',
        fontSize: '12px',
        marginTop: '4px',
    };

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div
                style={modalStyle}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Edit project"
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                    }}
                >
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                        Edit Project
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '20px',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            padding: '4px',
                        }}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Title *</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="Project title"
                            style={inputStyle}
                        />
                        {errors?.title && <div style={errorTextStyle}>{errors.title}</div>}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Funding Type</label>
                        <select
                            value={form.fundingType}
                            onChange={(e) => handleChange('fundingType', e.target.value)}
                            style={inputStyle}
                        >
                            <option value="">Select funding type</option>
                            {fundingOptions.map((f) => (
                                <option key={f} value={f}>
                                    {f.charAt(0) + f.slice(1).toLowerCase()}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Research Area</label>
                        <input
                            type="text"
                            value={form.researchArea}
                            onChange={(e) => handleChange('researchArea', e.target.value)}
                            placeholder="e.g. Carbon sequestration"
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Location</label>
                        <input
                            type="text"
                            value={form.location}
                            onChange={(e) => handleChange('location', e.target.value)}
                            placeholder="e.g. Kakum National Park"
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Start Date *</label>
                            <input
                                type="date"
                                value={form.startDate}
                                onChange={(e) => handleChange('startDate', e.target.value)}
                                style={inputStyle}
                            />
                            {errors?.startDate && (
                                <div style={errorTextStyle}>{errors.startDate}</div>
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>End Date</label>
                            <input
                                type="date"
                                value={form.endDate}
                                onChange={(e) => handleChange('endDate', e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={labelStyle}>Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Brief description of the project"
                            rows={3}
                            style={{ ...inputStyle, resize: 'vertical' }}
                        />
                    </div>

                    {serverError && (
                        <div
                            style={{
                                color: '#dc2626',
                                fontSize: '14px',
                                marginBottom: '16px',
                                padding: '8px 12px',
                                backgroundColor: '#fef2f2',
                                borderRadius: '6px',
                            }}
                        >
                            {serverError}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            style={{
                                padding: '9px 20px',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#475569',
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                padding: '9px 20px',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: 'white',
                                backgroundColor: submitting ? 'var(--color-primary-lighter)' : 'var(--color-primary)',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            {submitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
