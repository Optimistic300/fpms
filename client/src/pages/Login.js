import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useDivisions } from '../hooks/queries';

const DESIGNATIONS = [
    'Research Scientist',
    'Senior Research Scientist',
    'Principal Research Scientist',
    'Research Assistant',
    'Technical Officer',
    'Student Researcher',
];

export default function Login() {
    const [email, setEmail]           = useState('');
    const [password, setPassword]     = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [fullName, setFullName]     = useState('');
    const [designation, setDesignation] = useState('');
    const [divisionId, setDivisionId] = useState('');
    const [loading, setLoading]       = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();
    const { data: divisions = [] } = useDivisions();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const endpoint = isRegister ? '/auth/register' : '/auth/login';
            const payload = isRegister
                ? {
                    fullName,
                    email,
                    password,
                    designation: designation || null,
                    divisionId: divisionId ? Number(divisionId) : null,
                  }
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

                <div className="login-brand-name">CSIR-FORIG</div>
                <div className="login-brand-tagline">Progress Monitoring System</div>

                <div className="login-form-title">
                    {isRegister ? 'Create your account' : 'Sign in to continue'}
                </div>

                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <>
                            <div className="form-group">
                                <label className="form-label" htmlFor="reg-fullname">Full Name</label>
                                <input
                                    id="reg-fullname"
                                    type="text"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    className="form-input"
                                    placeholder="e.g. Kwame Asante"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="reg-designation">
                                    Designation <span className="form-label-opt">(optional)</span>
                                </label>
                                <select
                                    id="reg-designation"
                                    className="form-select"
                                    value={designation}
                                    onChange={e => setDesignation(e.target.value)}
                                >
                                    <option value="">Select designation…</option>
                                    {DESIGNATIONS.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="reg-division">
                                    Division <span className="form-label-opt">(optional)</span>
                                </label>
                                <select
                                    id="reg-division"
                                    className="form-select"
                                    value={divisionId}
                                    onChange={e => setDivisionId(e.target.value)}
                                >
                                    <option value="">Select division…</option>
                                    {divisions.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        </>
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
