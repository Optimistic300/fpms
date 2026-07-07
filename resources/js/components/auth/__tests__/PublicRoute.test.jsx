import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PublicRoute from '../PublicRoute';

const mockUseAuth = vi.fn();
const mockGetRoleRedirect = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
    getRoleRedirect: (role) => mockGetRoleRedirect(role),
}));

function renderPublic() {
    return render(
        <MemoryRouter initialEntries={['/login']}>
            <Routes>
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <div data-testid="login-content">Login Page Content</div>
                        </PublicRoute>
                    }
                />
                <Route path="/dashboard" element={<div data-testid="dashboard">Dashboard</div>} />
                <Route path="/users" element={<div data-testid="users">User Management</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe('PublicRoute', () => {
    it('renders children when not authenticated', () => {
        mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false, user: null });
        renderPublic();
        expect(screen.getByTestId('login-content')).toBeInTheDocument();
    });

    it('redirects authenticated user to role-based route', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            user: { role: 'RESEARCHER' },
        });
        mockGetRoleRedirect.mockReturnValue('/dashboard');
        renderPublic();
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
        expect(screen.queryByTestId('login-content')).not.toBeInTheDocument();
    });

    it('shows loading state when auth is loading', () => {
        mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: true, user: null });
        renderPublic();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(screen.queryByTestId('login-content')).not.toBeInTheDocument();
    });

    it('redirects ADMIN to /users', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            user: { role: 'ADMIN' },
        });
        mockGetRoleRedirect.mockReturnValue('/users');
        renderPublic();
        expect(screen.getByTestId('users')).toBeInTheDocument();
    });
});
