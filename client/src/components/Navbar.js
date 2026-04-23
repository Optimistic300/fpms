import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const initials = (user?.fullName || 'U')
        .split(' ')
        .filter(Boolean)
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const firstName = user?.fullName?.split(' ')[0] || '';

    const logout = () => {
        localStorage.clear();
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav>
            <div className="nav-inner">
                <button className="nav-brand" onClick={() => navigate('/dashboard')}>
                    <div className="nav-logo">🌿</div>
                    <div className="nav-wordmark">
                        <span className="nav-wordmark-top">FPMS</span>
                        <span className="nav-wordmark-sub">FORIG Progress Monitoring</span>
                    </div>
                </button>

                <div className="nav-right">
                    <div className="nav-links">
                        <button
                            className={`nav-link${isActive('/dashboard') ? ' active' : ''}`}
                            onClick={() => navigate('/dashboard')}
                        >
                            Dashboard
                        </button>
                        <button
                            className={`nav-link${isActive('/report') ? ' active' : ''}`}
                            onClick={() => navigate('/report')}
                        >
                            Reports
                        </button>
                        <button
                            className={`nav-link${isActive('/activities') ? ' active' : ''}`}
                            onClick={() => navigate('/activities')}
                        >
                            My Activities
                        </button>
                    </div>

                    <button className="nav-cta" onClick={() => navigate('/log')}>
                        + Log Activity
                    </button>

                    <div className="nav-user">
                        <div className="nav-avatar">{initials}</div>
                        <span className="nav-username">{firstName}</span>
                        <button className="nav-logout" onClick={logout} title="Sign out">⇥</button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
