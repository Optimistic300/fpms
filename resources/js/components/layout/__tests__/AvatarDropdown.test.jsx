import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AvatarDropdown from '../AvatarDropdown';

const mockUseAuth = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
}));

describe('AvatarDropdown', () => {
    it('shows user initials', () => {
        mockUseAuth.mockReturnValue({
            user: { fullName: 'John Doe', email: 'john@test.com', role: 'RESEARCHER' },
            logout: vi.fn(),
        });
        render(<AvatarDropdown />);
        expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('shows single initial for single name', () => {
        mockUseAuth.mockReturnValue({
            user: { fullName: 'John', email: 'john@test.com', role: 'RESEARCHER' },
            logout: vi.fn(),
        });
        render(<AvatarDropdown />);
        expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('shows dropdown with user info on click', async () => {
        const user = userEvent.setup();
        mockUseAuth.mockReturnValue({
            user: { fullName: 'Jane Doe', email: 'jane@test.com', role: 'SECRETARY' },
            logout: vi.fn(),
        });
        render(<AvatarDropdown />);
        await user.click(screen.getByLabelText('User menu'));
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        expect(screen.getByText('jane@test.com')).toBeInTheDocument();
        expect(screen.getByText('SECRETARY')).toBeInTheDocument();
    });

    it('calls logout when logout button is clicked', async () => {
        const user = userEvent.setup();
        const logout = vi.fn();
        mockUseAuth.mockReturnValue({
            user: { fullName: 'Jane Doe', email: 'jane@test.com', role: 'SECRETARY' },
            logout,
        });
        render(<AvatarDropdown />);
        await user.click(screen.getByLabelText('User menu'));
        await user.click(screen.getByText('Log out'));
        expect(logout).toHaveBeenCalledOnce();
    });
});
