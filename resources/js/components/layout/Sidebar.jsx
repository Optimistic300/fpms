import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import getSidebarItems from './getSidebarItems';

export default function Sidebar({ isOpen, onClose }) {
    const { user } = useAuth();
    const { unreadCount } = useNotification();
    const role = user?.role;
    const { workspace, institute, roleSpecific } = getSidebarItems(role);

    const linkBaseStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        fontSize: '14px',
        color: '#475569',
        textDecoration: 'none',
        borderRadius: '0 8px 8px 0',
        marginRight: '12px',
        transition: 'all 0.15s ease',
    };

    const activeStyle = {
        backgroundColor: 'white',
        color: 'var(--color-brand-dark)',
        fontWeight: 700,
        borderLeft: '3px solid var(--color-primary)',
        paddingLeft: '13px',
    };

    function renderSection(title, items) {
        if (!items || items.length === 0) return null;
        return (
            <div style={{ marginBottom: '24px' }}>
                <div
                    style={{
                        padding: '0 16px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '4px',
                    }}
                >
                    {title}
                </div>
                {items.map((item) => {
                    const badgeCount =
                        item.badge === 'inbox'
                            ? unreadCount
                            : item.badge === 'reports'
                              ? 0
                              : null;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={
                                item.path === '/dashboard' ||
                                item.path === '/queue' ||
                                item.path === '/division' ||
                                item.path === '/executive' ||
                                item.path === '/library' ||
                                item.path === '/inbox' ||
                                item.path === '/users' ||
                                item.path === '/settings'
                            }
                            onClick={onClose}
                            style={({ isActive }) => ({
                                ...linkBaseStyle,
                                ...(isActive ? activeStyle : {}),
                            })}
                        >
                            <span style={{ fontSize: '16px' }}>{item.icon}</span>
                            <span>{item.label}</span>
                            {badgeCount !== null && badgeCount > 0 && (
                                <span
                                    style={{
                                        marginLeft: 'auto',
                                        backgroundColor: badgeCount > 0 ? '#e53e3e' : '#e2e8f0',
                                        color: badgeCount > 0 ? 'white' : '#64748b',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        borderRadius: '10px',
                                        padding: '1px 8px',
                                    }}
                                >
                                    {badgeCount}
                                </span>
                            )}
                        </NavLink>
                    );
                })}
            </div>
        );
    }

    return (
        <>
            {isOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={onClose}
                    style={{
                        display: 'none',
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        zIndex: 90,
                    }}
                />
            )}
            <aside
                className="app-sidebar"
                style={{
                    width: '240px',
                    backgroundColor: '#f1f5f9',
                    borderRight: '1px solid #e2e8f0',
                    height: 'calc(100vh - 56px)',
                    position: 'fixed',
                    top: '56px',
                    left: 0,
                    overflowY: 'auto',
                    zIndex: 91,
                    transition: 'transform 0.2s ease',
                }}
            >
                <div style={{ padding: '16px 0' }}>
                    {renderSection('Workspace', workspace)}
                    {renderSection('Institute', institute)}
                    {renderSection('Role', roleSpecific)}
                </div>
            </aside>
        </>
    );
}
