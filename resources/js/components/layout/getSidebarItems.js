export default function getSidebarItems(role) {
    const workspace = [];
    const institute = [];
    const roleSpecific = [];

    if (role === 'ADMIN') {
        roleSpecific.push(
            { label: 'User Management', path: '/users', icon: '👥' },
            { label: 'Settings', path: '/settings', icon: '⚙️' },
        );
        institute.push(
            { label: 'Library', path: '/library', icon: '📚' },
            { label: 'Publications', path: '/publications', icon: '📄' },
            { label: 'Inbox', path: '/inbox', icon: '📬', badge: 'inbox' },
        );
        return { workspace, institute, roleSpecific };
    }

    if (role === 'RESEARCHER' || role === 'STUDENT') {
        workspace.push(
            { label: 'Dashboard', path: '/dashboard', icon: '📊' },
            { label: 'Projects', path: '/projects', icon: '📁' },
            { label: 'My Activities', path: '/activities', icon: '📝' },
            { label: 'Reports', path: '/reports', icon: '📋', badge: 'reports' },
        );
    }

    if (role === 'DIVISION_HEAD') {
        workspace.push(
            { label: 'Projects', path: '/projects', icon: '📁' },
            { label: 'My Activities', path: '/activities', icon: '📝' },
            { label: 'Reports', path: '/reports', icon: '📋', badge: 'reports' },
        );
    }

    if (role === 'SECRETARY') {
        workspace.push(
            { label: 'Projects', path: '/projects', icon: '📁' },
        );
        roleSpecific.push(
            { label: 'Report Queue', path: '/queue', icon: '📑' },
            { label: 'Submission History', path: '/submissions', icon: '📜' },
        );
    }

    if (role === 'MANAGEMENT') {
        workspace.push(
            { label: 'Projects', path: '/projects', icon: '📁' },
        );
    }

    institute.push(
        { label: 'Library', path: '/library', icon: '📚' },
        { label: 'Publications', path: '/publications', icon: '📄' },
        { label: 'Inbox', path: '/inbox', icon: '📬', badge: 'inbox' },
    );

    if (role === 'DIVISION_HEAD') {
        roleSpecific.push(
            { label: 'Division Overview', path: '/division', icon: '🏛️' },
        );
    }

    if (role === 'MANAGEMENT') {
        roleSpecific.push(
            { label: 'Executive Dashboard', path: '/executive', icon: '📈' },
        );
    }

    return { workspace, institute, roleSpecific };
}
