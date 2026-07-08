import { useState } from 'react';
import apiClient from '../../api/axios';

const roleOptions = ['LEAD', 'COLLABORATOR'];

export default function AddMemberModal({ isOpen, onClose, projectId, onAdded }) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('COLLABORATOR');
    const [errors, setErrors] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');

    if (!isOpen) return null;

    function validate() {
        const errs = {};
        if (!email.trim()) errs.email = 'Email is required.';
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
            const response = await apiClient.post(`/projects/${projectId}/members`, {
                email: email.trim(),
                role,
            });
            if (onAdded) onAdded(response.data.data);
            setEmail('');
            setRole('COLLABORATOR');
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
                setServerError(data?.message || 'Failed to add member. Please try again.');
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
        maxWidth: '440px',
        width: '100%',
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
                aria-label="Add team member"
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
                        Add Team Member
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
                        <label style={labelStyle}>Email Address *</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="researcher@example.com"
                            style={inputStyle}
                        />
                        {errors?.email && <div style={errorTextStyle}>{errors.email}</div>}
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={labelStyle}>Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            style={inputStyle}
                        >
                            {roleOptions.map((r) => (
                                <option key={r} value={r}>
                                    {r.charAt(0) + r.slice(1).toLowerCase()}
                                </option>
                            ))}
                        </select>
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
                                backgroundColor: submitting ? '#93c5fd' : '#2563eb',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            {submitting ? 'Adding...' : 'Add Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
