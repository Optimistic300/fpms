import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const tabs = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊', roles: ['RESEARCHER', 'STUDENT'] },
    { label: 'Projects', path: '/projects', icon: '📁' },
    { label: 'Log', path: '/log-activity', icon: '📝', roles: ['RESEARCHER', 'STUDENT', 'DIVISION_HEAD'] },
    { label: 'Library', path: '/library', icon: '📚' },
    { label: 'Inbox', path: '/inbox', icon: '📬' },
];

export default function BottomTabBar() {
    const { user } = useAuth();
    const role = user?.role;

    const visibleTabs = tabs.filter((tab) => {
        if (!tab.roles) return true;
        return tab.roles.includes(role);
    });

    if (visibleTabs.length === 0) return null;

    return (
        <nav
            className="bottom-tab-bar"
            style={{
                display: 'none',
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'white',
                borderTop: '1px solid #e2e8f0',
                zIndex: 100,
                padding: '4px 0',
                justifyContent: 'space-around',
                alignItems: 'center',
            }}
        >
            {visibleTabs.map((tab) => (
                <NavLink
                    key={tab.path}
                    to={tab.path}
                    end
                    style={({ isActive }) => ({
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        padding: '6px 12px',
                        textDecoration: 'none',
                        color: isActive ? 'var(--color-primary)' : '#64748b',
                        fontWeight: isActive ? 600 : 400,
                        fontSize: '10px',
                    })}
                >
                    <span style={{ fontSize: '20px' }}>{tab.icon}</span>
                    <span>{tab.label}</span>
                </NavLink>
            ))}
        </nav>
    );
}
