import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TopNav from '../TopNav';

const mockUseAuth = vi.fn();
const mockUseNotification = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
    getRoleRedirect: (role) => {
        const map = {
            RESEARCHER: '/dashboard',
            STUDENT: '/dashboard',
            SECRETARY: '/queue',
            DIVISION_HEAD: '/division',
            MANAGEMENT: '/executive',
            ADMIN: '/users',
        };
        return map[role] || '/dashboard';
    },
}));

vi.mock('../../../contexts/NotificationContext', () => ({
    useNotification: () => mockUseNotification(),
}));

function renderTopNav() {
    return render(
        <MemoryRouter>
            <TopNav onToggleSidebar={vi.fn()} />
        </MemoryRouter>
    );
}

describe('TopNav', () => {
    beforeEach(() => {
        mockUseNotification.mockReturnValue({ unreadCount: 0 });
    });

    it('shows logo linking to role-based landing', () => {
        mockUseAuth.mockReturnValue({
            user: { role: 'RESEARCHER', fullName: 'Test User', email: 'test@test.com' },
        });
        renderTopNav();
        expect(screen.getByText('FPMS')).toBeInTheDocument();
        expect(screen.getByText('FPMS').closest('a')).toHaveAttribute('href', '/dashboard');
    });

    it('shows action buttons for RESEARCHER', () => {
        mockUseAuth.mockReturnValue({
            user: { role: 'RESEARCHER', fullName: 'Test User', email: 'test@test.com' },
        });
        renderTopNav();
        expect(screen.getByText('Log Activity')).toBeInTheDocument();
        expect(screen.getByText('New Project')).toBeInTheDocument();
    });

    it('shows action buttons for DIVISION_HEAD', () => {
        mockUseAuth.mockReturnValue({
            user: { role: 'DIVISION_HEAD', fullName: 'Test User', email: 'test@test.com' },
        });
        renderTopNav();
        expect(screen.getByText('Log Activity')).toBeInTheDocument();
        expect(screen.getByText('New Project')).toBeInTheDocument();
    });

    it('hides action buttons and shows role pill for SECRETARY', () => {
        mockUseAuth.mockReturnValue({
            user: { role: 'SECRETARY', fullName: 'Secretary User', email: 'sec@test.com' },
        });
        renderTopNav();
        expect(screen.queryByText('Log Activity')).not.toBeInTheDocument();
        expect(screen.queryByText('New Project')).not.toBeInTheDocument();
        expect(screen.getByText('Scientific Secretary')).toBeInTheDocument();
    });

    it('hides action buttons and shows role pill for ADMIN', () => {
        mockUseAuth.mockReturnValue({
            user: { role: 'ADMIN', fullName: 'Admin User', email: 'admin@test.com' },
        });
        renderTopNav();
        expect(screen.queryByText('Log Activity')).not.toBeInTheDocument();
        expect(screen.queryByText('New Project')).not.toBeInTheDocument();
        expect(screen.getByText('Administrator')).toBeInTheDocument();
    });

    it('renders NotificationBell and AvatarDropdown', () => {
        mockUseAuth.mockReturnValue({
            user: { role: 'RESEARCHER', fullName: 'Test User', email: 'test@test.com' },
        });
        renderTopNav();
        expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
        expect(screen.getByLabelText('User menu')).toBeInTheDocument();
    });
});
