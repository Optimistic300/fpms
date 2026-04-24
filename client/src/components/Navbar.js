import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS } from '../constants';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { user, logout } = useAuth();

    const initials = (user?.fullName || 'U')
        .split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const firstName = user?.fullName?.split(' ')[0] || '';
    const role = user?.role || 'Research Officer';

    const handleLogout = () => { setDrawerOpen(false); logout(); navigate('/'); };

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
                aria-hidden="true"
            />

            {/* ── Slide-in drawer ── */}
            <div
                id="nav-drawer"
                className={`drawer${drawerOpen ? ' open' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-label="Navigation menu"
            >
                <div className="drawer-header">
                    <div className="drawer-user">
                        <div className="nav-avatar" aria-hidden="true">{initials}</div>
                        <div>
                            <div className="drawer-username">{user?.fullName || 'User'}</div>
                            <div className="drawer-role">{role}</div>
                        </div>
                    </div>
                    <button
                        className="drawer-close"
                        onClick={() => setDrawerOpen(false)}
                        aria-label="Close menu"
                    >
                        <span aria-hidden="true">✕</span>
                    </button>
                </div>

                {NAV_ITEMS.map(({ path, label, icon }) => (
                    <button
                        key={path}
                        className={`drawer-link${isActive(path) ? ' active' : ''}`}
                        onClick={() => go(path)}
                    >
                        <span className="drawer-icon" aria-hidden="true">{icon}</span>
                        {label}
                    </button>
                ))}

                <div className="drawer-divider" />

                <button className="drawer-cta" onClick={() => go('/log')}>
                    <span className="drawer-icon" aria-hidden="true">＋</span>
                    Log New Activity
                </button>

                <div className="drawer-divider" />

                <button className="drawer-logout" onClick={handleLogout}>
                    <span className="drawer-icon" aria-hidden="true">⇥</span>
                    Sign out
                </button>
            </div>

            {/* ── Top nav ── */}
            <nav>
                <div className="nav-inner">
                    <button className="nav-brand" onClick={() => go('/dashboard')}>
                        <div className="nav-logo" aria-hidden="true">🌿</div>
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
                            <div className="nav-avatar" aria-hidden="true">{initials}</div>
                            <span className="nav-username">{firstName}</span>
                            <button
                                className="nav-logout"
                                onClick={handleLogout}
                                aria-label="Sign out"
                            >
                                <span aria-hidden="true">⇥</span>
                            </button>
                        </div>

                        <button
                            className="nav-hamburger"
                            onClick={() => setDrawerOpen(v => !v)}
                            aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
                            aria-expanded={drawerOpen}
                            aria-controls="nav-drawer"
                        >
                            <span aria-hidden="true">☰</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── Bottom tab bar (mobile) ── */}
            <div className="bottom-bar" role="navigation" aria-label="Main navigation">
                <button
                    className={`bottom-tab${isActive('/dashboard') ? ' active' : ''}`}
                    onClick={() => go('/dashboard')}
                >
                    <span className="bt-icon" aria-hidden="true">📊</span>
                    <span className="bt-label">Dashboard</span>
                </button>

                <button
                    className={`bottom-tab${isActive('/report') ? ' active' : ''}`}
                    onClick={() => go('/report')}
                >
                    <span className="bt-icon" aria-hidden="true">📋</span>
                    <span className="bt-label">Reports</span>
                </button>

                <button className="bottom-tab bottom-tab-cta" onClick={() => go('/log')}>
                    <span className="bt-icon" aria-hidden="true">＋</span>
                    <span className="bt-label">Log Activity</span>
                </button>

                <button
                    className={`bottom-tab${isActive('/activities') ? ' active' : ''}`}
                    onClick={() => go('/activities')}
                >
                    <span className="bt-icon" aria-hidden="true">🗂</span>
                    <span className="bt-label">My Activities</span>
                </button>
            </div>
        </>
    );
}
