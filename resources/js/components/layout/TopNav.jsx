import { Link } from 'react-router-dom';
import { useAuth, getRoleRedirect } from '../../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import AvatarDropdown from './AvatarDropdown';
import OfflineIndicator from './OfflineIndicator';

const actionRoles = ['RESEARCHER', 'STUDENT', 'DIVISION_HEAD'];

const roleDisplayNames = {
    RESEARCHER: 'Researcher',
    STUDENT: 'CCST Student',
    SECRETARY: 'Scientific Secretary',
    DIVISION_HEAD: 'Division Head',
    MANAGEMENT: 'Management',
    ADMIN: 'Administrator',
};

export default function TopNav({ onToggleSidebar }) {
    const { user } = useAuth();
    const role = user?.role;
    const landingPath = getRoleRedirect(role);
    const showActions = actionRoles.includes(role);
    const showRolePill = role === 'SECRETARY' || role === 'ADMIN';

    return (
        <header
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '56px',
                backgroundColor: 'white',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                zIndex: 100,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                    className="sidebar-toggle"
                    onClick={onToggleSidebar}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '20px',
                        cursor: 'pointer',
                        display: 'none',
                        padding: '4px',
                    }}
                    aria-label="Toggle sidebar"
                >
                    ☰
                </button>
                <Link
                    to={landingPath}
                    style={{
                        fontWeight: 700,
                        fontSize: '18px',
                        color: '#1a365d',
                        textDecoration: 'none',
                    }}
                >
                    SKMS
                </Link>
                <OfflineIndicator />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {showActions && (
                    <>
                        <Link
                            to="/log-activity"
                            style={{
                                padding: '6px 14px',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: '#2b6cb0',
                                border: '1px solid #2b6cb0',
                                borderRadius: '6px',
                                textDecoration: 'none',
                            }}
                        >
                            Log Activity
                        </Link>
                        <Link
                            to="/projects/new"
                            style={{
                                padding: '6px 14px',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: 'white',
                                backgroundColor: '#2b6cb0',
                                borderRadius: '6px',
                                textDecoration: 'none',
                            }}
                        >
                            New Project
                        </Link>
                    </>
                )}
                {showRolePill && (
                    <span
                        style={{
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#2b6cb0',
                            backgroundColor: '#ebf4ff',
                            borderRadius: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}
                    >
                        {roleDisplayNames[role] || role}
                    </span>
                )}
                <NotificationBell />
                <AvatarDropdown />
            </div>
        </header>
    );
}
