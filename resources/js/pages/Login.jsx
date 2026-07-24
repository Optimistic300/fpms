import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getRoleRedirect } from '../contexts/AuthContext';
import apiClient from '../api/axios';

export default function Login() {
    const { login, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotSent, setForgotSent] = useState(false);
    const [forgotError, setForgotError] = useState('');
    const [forgotSubmitting, setForgotSubmitting] = useState(false);

    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (isAuthenticated && user) {
            navigate(getRoleRedirect(user.role), { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    useEffect(() => {
        apiClient.get('/public/stats')
            .then((response) => setStats(response.data.data))
            .catch(() => {});
    }, []);

    function validateEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    async function handleLogin(e) {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Email is required.');
            return;
        }
        if (!validateEmail(email)) {
            setError('Invalid email format.');
            return;
        }
        if (!password) {
            setError('Password is required.');
            return;
        }

        setIsSubmitting(true);
        try {
            await login(email, password);
        } catch (err) {
            const status = err.response?.status;
            const message = err.response?.data?.message || 'Login failed. Please try again.';
            if (status === 403 && message.toLowerCase().includes('deactivated')) {
                setError('Account deactivated. Contact your administrator.');
            } else {
                setError(message);
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleForgotPassword(e) {
        e.preventDefault();
        setForgotError('');

        if (!forgotEmail.trim() || !validateEmail(forgotEmail)) {
            setForgotError('Please enter a valid email address.');
            return;
        }

        setForgotSubmitting(true);
        try {
            await apiClient.post('/auth/forgot-password', { email: forgotEmail });
            setForgotSent(true);
        } catch {
            setForgotError('Failed to send reset link. Please try again.');
        } finally {
            setForgotSubmitting(false);
        }
    }

    function handleBackToLogin() {
        setShowForgotPassword(false);
        setForgotSent(false);
        setForgotError('');
        setForgotEmail('');
    }

    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        fontSize: '14px',
    };

    const errorBoxStyle = {
        color: '#e53e3e',
        fontSize: '14px',
        marginBottom: '16px',
        padding: '8px 12px',
        backgroundColor: '#fff5f5',
        borderRadius: '6px',
    };

    const btnStyle = {
        width: '100%',
        padding: '10px',
        backgroundColor: '#2b6cb0',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '16px',
        fontWeight: 600,
        cursor: 'pointer',
    };

    const linkStyle = {
        background: 'none',
        border: 'none',
        color: '#2b6cb0',
        cursor: 'pointer',
        fontSize: '14px',
        textDecoration: 'underline',
        padding: 0,
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <div
                className="login-brand-panel"
                style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 100%)',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '40px',
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px', fontWeight: 700 }}>
                        SKMS
                    </div>
                    <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>
                        Scientific Knowledge Management System
                    </h1>
                    <p style={{ fontSize: '16px', opacity: 0.8, marginBottom: '32px' }}>
                        Empowering research through collaboration
                    </p>
                    <div
                        style={{
                            display: 'flex',
                            gap: '32px',
                            justifyContent: 'center',
                        }}
                    >
                        <div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                                {stats?.activeProjects ?? '—'}
                            </div>
                            <div style={{ fontSize: '14px', opacity: 0.7 }}>
                                Active Projects
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                                {stats?.libraryDocuments ?? '—'}
                            </div>
                            <div style={{ fontSize: '14px', opacity: 0.7 }}>
                                Library Documents
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                                {stats?.divisionsConnected ?? '—'}
                            </div>
                            <div style={{ fontSize: '14px', opacity: 0.7 }}>
                                Divisions
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '40px',
                    backgroundColor: '#f7fafc',
                }}
            >
                <div
                    style={{
                        width: '100%',
                        maxWidth: '400px',
                        backgroundColor: 'white',
                        padding: '40px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    }}
                >
                    <div
                        className="login-mobile-logo"
                        style={{ display: 'none', textAlign: 'center', marginBottom: '24px' }}
                    >
                        <div style={{ fontSize: '36px', fontWeight: 700 }}>SKMS</div>
                    </div>

                    {!showForgotPassword ? (
                        <>
                            <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Sign In</h2>
                            <p
                                style={{
                                    fontSize: '14px',
                                    color: '#718096',
                                    marginBottom: '24px',
                                }}
                            >
                                Enter your credentials to access the system
                            </p>
                            <form onSubmit={handleLogin}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label
                                        style={{
                                            display: 'block',
                                            marginBottom: '6px',
                                            fontSize: '14px',
                                            fontWeight: 500,
                                        }}
                                    >
                                        Work Email
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <label
                                        style={{
                                            display: 'block',
                                            marginBottom: '6px',
                                            fontSize: '14px',
                                            fontWeight: 500,
                                        }}
                                    >
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        style={inputStyle}
                                    />
                                </div>
                                {error && <div style={errorBoxStyle}>{error}</div>}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{
                                        ...btnStyle,
                                        opacity: isSubmitting ? 0.7 : 1,
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                                </button>
                            </form>
                            <div style={{ marginTop: '16px', textAlign: 'center' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    style={linkStyle}
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <p
                                style={{
                                    marginTop: '24px',
                                    fontSize: '12px',
                                    color: '#a0aec0',
                                    textAlign: 'center',
                                }}
                            >
                                Contact your administrator for access
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Reset Password</h2>
                            {!forgotSent ? (
                                <>
                                    <p
                                        style={{
                                            fontSize: '14px',
                                            color: '#718096',
                                            marginBottom: '24px',
                                        }}
                                    >
                                        Enter your email address and we will send you a reset link.
                                    </p>
                                    <form onSubmit={handleForgotPassword}>
                                        <div style={{ marginBottom: '16px' }}>
                                            <label
                                                style={{
                                                    display: 'block',
                                                    marginBottom: '6px',
                                                    fontSize: '14px',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                value={forgotEmail}
                                                onChange={(e) => setForgotEmail(e.target.value)}
                                                placeholder="you@example.com"
                                                style={inputStyle}
                                            />
                                        </div>
                                        {forgotError && <div style={errorBoxStyle}>{forgotError}</div>}
                                        <button
                                            type="submit"
                                            disabled={forgotSubmitting}
                                            style={{
                                                ...btnStyle,
                                                opacity: forgotSubmitting ? 0.7 : 1,
                                                cursor: forgotSubmitting ? 'not-allowed' : 'pointer',
                                            }}
                                        >
                                            {forgotSubmitting ? 'Sending...' : 'Send Reset Link'}
                                        </button>
                                    </form>
                                    <div style={{ marginTop: '16px', textAlign: 'center' }}>
                                        <button
                                            type="button"
                                            onClick={handleBackToLogin}
                                            style={linkStyle}
                                        >
                                            Back to Sign In
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: '16px', color: '#38a169', marginBottom: '24px' }}>
                                        Check your email
                                    </p>
                                    <p
                                        style={{
                                            fontSize: '14px',
                                            color: '#718096',
                                            marginBottom: '24px',
                                        }}
                                    >
                                        If an account exists with that email, we have sent a password reset link.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleBackToLogin}
                                        style={linkStyle}
                                    >
                                        Back to Sign In
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
