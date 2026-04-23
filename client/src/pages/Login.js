import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = isRegister ? '/auth/register' : '/auth/login';
            const payload = isRegister
                ? { fullName, email, password }
                : { email, password };

            const response = await api.post(endpoint, payload);

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify({
                fullName: response.data.fullName,
                email: response.data.email,
                role: response.data.role,
            }));

            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const toggle = () => { setIsRegister(v => !v); setError(''); };

    return (
        <div id="page-login">
            <div className="login-card">
                <div className="login-badge">🌿 CSIR · FORIG</div>

                <div className="login-heading">
                    {isRegister ? 'Create account.' : 'Welcome back.'}
                </div>
                <div className="login-sub">
                    {isRegister ? 'Join your workspace' : 'Sign in to your workspace'}
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                className="form-input"
                                placeholder="e.g. Joshua Abubakar"
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Email address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="form-input"
                            placeholder="you@csir-forig.org"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="form-input"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary btn-full"
                        style={{ marginTop: '4px' }}
                    >
                        {loading ? 'Please wait…' : isRegister ? 'Create Account' : 'Sign in to FPMS'}
                    </button>
                </form>

                <div className="login-footer">
                    <span>{isRegister ? 'Already have an account?' : "Don't have an account?"}</span>
                    <button onClick={toggle}>
                        {isRegister ? 'Sign in' : 'Register'}
                    </button>
                </div>
            </div>
        </div>
    );
}
