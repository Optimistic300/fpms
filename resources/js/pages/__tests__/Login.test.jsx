import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';

const mockLogin = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        login: mockLogin,
        isAuthenticated: false,
        user: null,
        loading: false,
    }),
    getRoleRedirect: (role) => {
        const map = { RESEARCHER: '/dashboard', ADMIN: '/users', SECRETARY: '/queue' };
        return map[role] || '/dashboard';
    },
}));

const mockApiGet = vi.fn();
const mockApiPost = vi.fn();

vi.mock('../../api/axios', () => ({
    default: {
        get: (...args) => mockApiGet(...args),
        post: (...args) => mockApiPost(...args),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
}));

function getForm() {
    return screen.getByRole('button', { name: /sign in/i }).closest('form');
}

function submitForm() {
    const form = getForm();
    if (form) fireEvent.submit(form);
}

function renderLogin() {
    return render(
        <MemoryRouter initialEntries={['/login']}>
            <Login />
        </MemoryRouter>
    );
}

describe('Login Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockApiGet.mockResolvedValue({
            data: {
                data: {
                    activeProjects: 24,
                    libraryDocuments: 156,
                    divisionsConnected: 5,
                },
            },
        });
    });

    it('renders the login form', () => {
        renderLogin();
        expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders the brand panel with system name', () => {
        renderLogin();
        expect(screen.getByText('Scientific Knowledge Management System')).toBeInTheDocument();
    });

    it('fetches and displays public stats on mount', async () => {
        renderLogin();
        await waitFor(() => {
            expect(mockApiGet).toHaveBeenCalledWith('/public/stats');
        });
        await waitFor(() => {
            expect(screen.getByText('24')).toBeInTheDocument();
        });
        expect(screen.getByText('156')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('shows inline error for wrong credentials', async () => {
        mockLogin.mockRejectedValueOnce({
            response: { status: 422, data: { message: 'Invalid email or password.' } },
        });

        renderLogin();

        fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
            target: { value: 'wrong@test.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
            target: { value: 'wrongpass' },
        });
        submitForm();

        await waitFor(() => {
            expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
        });
    });

    it('shows specific error for inactive user (403)', async () => {
        mockLogin.mockRejectedValueOnce({
            response: {
                status: 403,
                data: { message: 'Your account has been deactivated. Contact an administrator.' },
            },
        });

        renderLogin();

        fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
            target: { value: 'inactive@test.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
            target: { value: 'password' },
        });
        submitForm();

        await waitFor(() => {
            expect(
                screen.getByText('Account deactivated. Contact your administrator.')
            ).toBeInTheDocument();
        });
    });

    it('shows validation error for empty email', () => {
        renderLogin();

        fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
            target: { value: 'password' },
        });
        submitForm();

        expect(screen.getByText('Email is required.')).toBeInTheDocument();
    });

    it('shows validation error for invalid email format', () => {
        renderLogin();

        fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
            target: { value: 'not-an-email' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
            target: { value: 'password' },
        });
        submitForm();

        expect(screen.getByText('Invalid email format.')).toBeInTheDocument();
    });

    it('shows validation error for empty password', () => {
        renderLogin();

        fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
            target: { value: 'test@test.com' },
        });
        submitForm();

        expect(screen.getByText('Password is required.')).toBeInTheDocument();
    });

    it('displays forgot password form when link is clicked', () => {
        renderLogin();

        fireEvent.click(screen.getByText('Forgot password?'));

        expect(screen.getByText('Reset Password')).toBeInTheDocument();
        expect(screen.getByText('Send Reset Link')).toBeInTheDocument();
    });

    it('shows success message after submitting forgot password form', async () => {
        mockApiPost.mockResolvedValueOnce({ data: { message: 'Reset link sent.' } });

        renderLogin();

        fireEvent.click(screen.getByText('Forgot password?'));

        expect(screen.getByText('Send Reset Link')).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
            target: { value: 'reset@test.com' },
        });

        const forgotForm = screen.getByRole('button', { name: /send reset link/i }).closest('form');
        if (forgotForm) fireEvent.submit(forgotForm);

        await waitFor(() => {
            expect(screen.getByText('Check your email')).toBeInTheDocument();
        });
        expect(mockApiPost).toHaveBeenCalledWith('/auth/forgot-password', {
            email: 'reset@test.com',
        });
    });

    it('shows contact administrator note', () => {
        renderLogin();
        expect(
            screen.getByText('Contact your administrator for access')
        ).toBeInTheDocument();
    });
});
