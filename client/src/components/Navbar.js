import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Plus, LogOut, Leaf, LayoutDashboard, ClipboardList, FolderOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS } from '../constants';

const BOTTOM_TABS = [
    { path: '/dashboard',  label: 'Dashboard',    Icon: LayoutDashboard },
    { path: '/report',     label: 'Reports',       Icon: ClipboardList   },
    { path: '/log',        label: 'Log Activity',  Icon: Plus, cta: true },
    { path: '/activities', label: 'My Activities', Icon: FolderOpen      },
];

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
                        <X size={15} aria-hidden="true" />
                    </button>
                </div>

                {NAV_ITEMS.map(({ path, label, Icon }) => (
                    <button
                        key={path}
                        className={`drawer-link${isActive(path) ? ' active' : ''}`}
                        onClick={() => go(path)}
                    >
                        <Icon size={18} className="drawer-icon" aria-hidden="true" />
                        {label}
                    </button>
                ))}

                <div className="drawer-divider" />

                <button className="drawer-cta" onClick={() => go('/log')}>
                    <Plus size={18} className="drawer-icon" aria-hidden="true" />
                    Log New Activity
                </button>

                <div className="drawer-divider" />

                <button className="drawer-logout" onClick={handleLogout}>
                    <LogOut size={16} className="drawer-icon" aria-hidden="true" />
                    Sign out
                </button>
            </div>

            {/* ── Top nav ── */}
            <nav>
                <div className="nav-inner">
                    <button className="nav-brand" onClick={() => go('/dashboard')}>
                        <div className="nav-logo" aria-hidden="true">
                            <Leaf size={18} />
                        </div>
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
                                <Plus size={14} aria-hidden="true" /> Log Activity
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
                                <LogOut size={16} aria-hidden="true" />
                            </button>
                        </div>

                        <button
                            className="nav-hamburger"
                            onClick={() => setDrawerOpen(v => !v)}
                            aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
                            aria-expanded={drawerOpen}
                            aria-controls="nav-drawer"
                        >
                            <Menu size={22} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── Bottom tab bar (mobile) ── */}
            <div className="bottom-bar" role="navigation" aria-label="Main navigation">
                {BOTTOM_TABS.map(({ path, label, Icon, cta }) => (
                    <button
                        key={path}
                        className={`bottom-tab${cta ? ' bottom-tab-cta' : ''}${isActive(path) ? ' active' : ''}`}
                        onClick={() => go(path)}
                    >
                        <Icon size={20} className="bt-icon" aria-hidden="true" />
                        <span className="bt-label">{label}</span>
                    </button>
                ))}
            </div>
        </>
    );
}
