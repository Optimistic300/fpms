import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

const mockUseAuth = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
}));

function renderProtected(initialRoute = '/') {
    return render(
        <MemoryRouter initialEntries={[initialRoute]}>
            <Routes>
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <div data-testid="protected-content">Protected Content</div>
                        </ProtectedRoute>
                    }
                />
                <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe('ProtectedRoute', () => {
    it('renders children when authenticated', () => {
        mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
        renderProtected();
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    });

    it('redirects to /login when not authenticated', () => {
        mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });
        renderProtected();
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('shows loading state when auth is loading', () => {
        mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: true });
        renderProtected();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
        expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    });
});
