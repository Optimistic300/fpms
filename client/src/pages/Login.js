import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const endpoint = isRegister ? '/auth/register' : '/auth/login';
            const payload = isRegister
                ? { fullName, email, password }
                : { email, password };

            const response = await api.post(endpoint, payload);

            login(response.data);
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const toggle = () => { setIsRegister(v => !v); };

    return (
        <div id="page-login">
            <div className="login-card">
                <div className="login-badge">
                    <Leaf size={12} aria-hidden="true" /> CSIR · FORIG
                </div>

                <div className="login-heading">
                    {isRegister ? 'Create account.' : 'Welcome back.'}
                </div>
                <div className="login-sub">
                    {isRegister ? 'Join your workspace' : 'Sign in to your workspace'}
                </div>

                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <div className="form-group">
                            <label className="form-label" htmlFor="reg-fullname">Full Name</label>
                            <input
                                id="reg-fullname"
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
                        <label className="form-label" htmlFor="login-email">Email address</label>
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="form-input"
                            placeholder="you@csir-forig.org"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
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
                        className="btn btn-primary btn-full u-mt-1"
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
