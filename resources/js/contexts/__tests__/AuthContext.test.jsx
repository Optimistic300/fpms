import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth, getRoleRedirect } from '../AuthContext';

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('../../api/axios', () => ({
    default: {
        get: (...args) => mockGet(...args),
        post: (...args) => mockPost(...args),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
}));

function TestComponent() {
    const auth = useAuth();
    return (
        <div>
            <div data-testid="token">{auth.token || 'null'}</div>
            <div data-testid="user">{auth.user ? JSON.stringify(auth.user) : 'null'}</div>
            <div data-testid="is-authenticated">{String(auth.isAuthenticated)}</div>
            <div data-testid="loading">{String(auth.loading)}</div>
            <button data-testid="login-btn" onClick={() => auth.login('test@test.com', 'password')}>
                Login
            </button>
            <button data-testid="logout-btn" onClick={() => auth.logout()}>
                Logout
            </button>
        </div>
    );
}

function renderWithProvider() {
    return render(
        <AuthProvider>
            <TestComponent />
        </AuthProvider>
    );
}

describe('AuthContext', () => {
    beforeEach(() => {
        localStorage.clear();
        mockGet.mockReset();
        mockPost.mockReset();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('provides initial unauthenticated state when no token exists', async () => {
        renderWithProvider();
        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
        });
        expect(screen.getByTestId('token')).toHaveTextContent('null');
        expect(screen.getByTestId('user')).toHaveTextContent('null');
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });

    it('validates stored token on mount and sets user when valid', async () => {
        localStorage.setItem('auth_token', 'valid-token');
        const userData = {
            data: {
                userId: 1,
                fullName: 'John Doe',
                email: 'john@test.com',
                role: 'RESEARCHER',
                division: 'Forest Science',
                valid: true,
            },
        };
        mockGet.mockResolvedValueOnce({ data: userData });

        renderWithProvider();

        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
        });
        expect(mockGet).toHaveBeenCalledWith('/auth/validate');
        expect(screen.getByTestId('token')).toHaveTextContent('valid-token');
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    it('clears invalid token on mount when validation fails', async () => {
        localStorage.setItem('auth_token', 'expired-token');
        mockGet.mockRejectedValueOnce(new Error('Unauthorized'));

        renderWithProvider();

        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
        });
        expect(localStorage.getItem('auth_token')).toBeNull();
        expect(screen.getByTestId('token')).toHaveTextContent('null');
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });

    it('login stores token and user', async () => {
        const apiResponse = {
            data: {
                data: {
                    userId: 1,
                    fullName: 'Jane Doe',
                    email: 'jane@test.com',
                    role: 'SECRETARY',
                    division: 'Administration',
                    token: 'new-token-123',
                },
            },
        };
        mockPost.mockResolvedValueOnce(apiResponse);

        renderWithProvider();

        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
        });

        screen.getByTestId('login-btn').click();

        await waitFor(() => {
            expect(screen.getByTestId('token')).toHaveTextContent('new-token-123');
        });
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
        expect(localStorage.getItem('auth_token')).toBe('new-token-123');
    });

    it('logout clears token and user', async () => {
        localStorage.setItem('auth_token', 'some-token');
        localStorage.setItem('auth_user', JSON.stringify({ userId: 1, fullName: 'Test', email: 't@t.com', role: 'ADMIN' }));
        mockPost.mockResolvedValueOnce({ data: { message: 'Logged out' } });

        renderWithProvider();

        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('false');
        });

        screen.getByTestId('logout-btn').click();

        await waitFor(() => {
            expect(screen.getByTestId('token')).toHaveTextContent('null');
        });
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
        expect(localStorage.getItem('auth_token')).toBeNull();
    });

    it('throws error when useAuth is used outside provider', () => {
        expect(() => render(<TestComponent />)).toThrow('useAuth must be used within an AuthProvider');
    });
});

describe('getRoleRedirect', () => {
    it('returns correct redirect paths for each role', () => {
        expect(getRoleRedirect('RESEARCHER')).toBe('/dashboard');
        expect(getRoleRedirect('STUDENT')).toBe('/dashboard');
        expect(getRoleRedirect('SECRETARY')).toBe('/queue');
        expect(getRoleRedirect('DIVISION_HEAD')).toBe('/division');
        expect(getRoleRedirect('MANAGEMENT')).toBe('/executive');
        expect(getRoleRedirect('ADMIN')).toBe('/users');
    });

    it('defaults to /dashboard for unknown role', () => {
        expect(getRoleRedirect('UNKNOWN')).toBe('/dashboard');
    });
});
