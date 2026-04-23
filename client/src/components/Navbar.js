import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
    { path: '/dashboard',  label: 'Dashboard'     },
    { path: '/report',     label: 'Reports'        },
    { path: '/activities', label: 'My Activities'  },
];

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const initials = (user?.fullName || 'U')
        .split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const firstName = user?.fullName?.split(' ')[0] || '';

    const logout = () => { localStorage.clear(); navigate('/'); };

    const isActive = (path) => location.pathname === path;

    const go = (path) => { navigate(path); setMenuOpen(false); };

    return (
        <nav>
            <div className="nav-inner">
                <button className="nav-brand" onClick={() => go('/dashboard')}>
                    <div className="nav-logo">🌿</div>
                    <div className="nav-wordmark">
                        <span className="nav-wordmark-top">FPMS</span>
                        <span className="nav-wordmark-sub">FORIG Progress Monitoring</span>
                    </div>
                </button>

                <div className="nav-right">
                    <div className="nav-desktop-actions">
                        <div className="nav-links">
                            {NAV_ITEMS.map(({ path, label }) => (
                                <button
                                    key={path}
                                    className={`nav-link${isActive(path) ? ' active' : ''}`}
                                    onClick={() => go(path)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <button className="nav-cta" onClick={() => go('/log')}>
                            + Log Activity
                        </button>
                    </div>

                    <div className="nav-user">
                        <div className="nav-avatar">{initials}</div>
                        <span className="nav-username">{firstName}</span>
                        <button className="nav-logout" onClick={logout} title="Sign out">⇥</button>
                    </div>

                    <button
                        className="nav-hamburger"
                        onClick={() => setMenuOpen(v => !v)}
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? '✕' : '☰'}
                    </button>
                </div>
            </div>

            {menuOpen && (
                <div className="nav-mobile-menu">
                    {NAV_ITEMS.map(({ path, label }) => (
                        <button
                            key={path}
                            className={`nav-link${isActive(path) ? ' active' : ''}`}
                            onClick={() => go(path)}
                        >
                            {label}
                        </button>
                    ))}
                    <button className="nav-cta nav-cta-mobile" onClick={() => go('/log')}>
                        + Log Activity
                    </button>
                </div>
            )}
        </nav>
    );
}
