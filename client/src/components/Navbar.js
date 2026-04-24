import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
    { path: '/dashboard',  label: 'Dashboard',    icon: '📊' },
    { path: '/report',     label: 'Reports',       icon: '📋' },
    { path: '/activities', label: 'My Activities', icon: '🗂'  },
];

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const initials = (user?.fullName || 'U')
        .split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const firstName = user?.fullName?.split(' ')[0] || '';
    const role = user?.role || 'Research Officer';

    const logout = () => { setDrawerOpen(false); localStorage.clear(); navigate('/'); };

    const isActive = (path) => location.pathname === path;

    const go = (path) => { navigate(path); setDrawerOpen(false); };

    useEffect(() => {
        document.body.style.overflow = drawerOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [drawerOpen]);

    return (
        <>
            {/* ── Drawer overlay ── */}
            <div
                className={`drawer-overlay${drawerOpen ? ' open' : ''}`}
                onClick={() => setDrawerOpen(false)}
            />

            {/* ── Slide-in drawer ── */}
            <div className={`drawer${drawerOpen ? ' open' : ''}`}>
                <div className="drawer-header">
                    <div className="drawer-user">
                        <div className="nav-avatar">{initials}</div>
                        <div>
                            <div className="drawer-username">{user.fullName || 'User'}</div>
                            <div className="drawer-role">{role}</div>
                        </div>
                    </div>
                    <button className="drawer-close" onClick={() => setDrawerOpen(false)}>✕</button>
                </div>

                {NAV_ITEMS.map(({ path, label, icon }) => (
                    <button
                        key={path}
                        className={`drawer-link${isActive(path) ? ' active' : ''}`}
                        onClick={() => go(path)}
                    >
                        <span className="drawer-icon">{icon}</span>
                        {label}
                    </button>
                ))}

                <div className="drawer-divider" />

                <button className="drawer-cta" onClick={() => go('/log')}>
                    <span className="drawer-icon">＋</span>
                    Log New Activity
                </button>

                <div className="drawer-divider" />

                <button className="drawer-logout" onClick={logout}>
                    <span className="drawer-icon">⇥</span>
                    Sign out
                </button>
            </div>

            {/* ── Top nav ── */}
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
                            onClick={() => setDrawerOpen(v => !v)}
                            aria-label="Open menu"
                        >
                            ☰
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── Bottom tab bar (mobile) ── */}
            <div className="bottom-bar">
                <button
                    className={`bottom-tab${isActive('/dashboard') ? ' active' : ''}`}
                    onClick={() => go('/dashboard')}
                >
                    <span className="bt-icon">📊</span>
                    <span className="bt-label">Dashboard</span>
                </button>

                <button
                    className={`bottom-tab${isActive('/report') ? ' active' : ''}`}
                    onClick={() => go('/report')}
                >
                    <span className="bt-icon">📋</span>
                    <span className="bt-label">Reports</span>
                </button>

                <button className="bottom-tab bottom-tab-cta" onClick={() => go('/log')}>
                    <span className="bt-icon">＋</span>
                    <span className="bt-label">Log</span>
                </button>

                <button
                    className={`bottom-tab${isActive('/activities') ? ' active' : ''}`}
                    onClick={() => go('/activities')}
                >
                    <span className="bt-icon">🗂</span>
                    <span className="bt-label">Mine</span>
                </button>
            </div>
        </>
    );
}
