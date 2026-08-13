import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import apiClient from '../api/axios';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const email = searchParams.get('email') || '';

    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!token || !email) {
            setError('This reset link is invalid. Please request a new one.');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (password !== passwordConfirmation) {
            setError('Passwords do not match.');
            return;
        }

        setSubmitting(true);
        try {
            await apiClient.post('/auth/reset-password', {
                email,
                token,
                password,
                password_confirmation: passwordConfirmation,
            });
            setDone(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired reset link.');
        } finally {
            setSubmitting(false);
        }
    }

    const pageStyle = {
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f7fafc',
        padding: '40px',
    };

    const cardStyle = {
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    };

    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        fontSize: '14px',
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '6px',
        fontSize: '14px',
        fontWeight: 500,
    };

    const btnStyle = {
        width: '100%',
        padding: '10px',
        backgroundColor: submitting ? 'var(--color-primary-lighter)' : 'var(--color-primary)',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '16px',
        fontWeight: 600,
        cursor: submitting ? 'not-allowed' : 'pointer',
    };

    return (
        <div style={pageStyle}>
            <div style={cardStyle}>
                {done ? (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '16px', color: 'var(--color-primary)', marginBottom: '16px' }}>
                            Password reset successful.
                        </p>
                        <p style={{ fontSize: '14px', color: '#718096', marginBottom: '24px' }}>
                            You can now sign in with your new password.
                        </p>
                        <Link
                            to="/login"
                            style={{
                                display: 'inline-block',
                                color: 'white',
                                backgroundColor: 'var(--color-primary)',
                                padding: '10px 24px',
                                borderRadius: '6px',
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: '14px',
                            }}
                        >
                            Back to Sign In
                        </Link>
                    </div>
                ) : (
                    <>
                        <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Reset Password</h2>
                        <p style={{ fontSize: '14px', color: '#718096', marginBottom: '24px' }}>
                            Enter a new password for {email || 'your account'}.
                        </p>

                        {!token || !email ? (
                            <p style={{ color: '#e53e3e', fontSize: '14px' }}>
                                This reset link is invalid or incomplete. Please request a new one from
                                the login page.
                            </p>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                {error && (
                                    <div
                                        style={{
                                            color: '#e53e3e',
                                            fontSize: '14px',
                                            marginBottom: '16px',
                                            padding: '8px 12px',
                                            backgroundColor: '#fff5f5',
                                            borderRadius: '6px',
                                        }}
                                    >
                                        {error}
                                    </div>
                                )}

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={labelStyle}>New Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={inputStyle}
                                        autoFocus
                                    />
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <label style={labelStyle}>Confirm Password</label>
                                    <input
                                        type="password"
                                        value={passwordConfirmation}
                                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                                        style={inputStyle}
                                    />
                                </div>

                                <button type="submit" style={btnStyle} disabled={submitting}>
                                    {submitting ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </form>
                        )}

                        <div style={{ marginTop: '16px', textAlign: 'center' }}>
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-primary)',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    textDecoration: 'underline',
                                    padding: 0,
                                }}
                            >
                                Back to Sign In
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
