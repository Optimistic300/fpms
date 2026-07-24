import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationBell from '../NotificationBell';

const mockUseNotification = vi.fn();

vi.mock('../../../contexts/NotificationContext', () => ({
    useNotification: () => mockUseNotification(),
}));

describe('NotificationBell', () => {
    it('shows bell icon without badge when unread count is 0', () => {
        mockUseNotification.mockReturnValue({ unreadCount: 0 });
        render(<NotificationBell />);
        expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
        expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('shows unread badge when count is greater than 0', () => {
        mockUseNotification.mockReturnValue({ unreadCount: 5 });
        render(<NotificationBell />);
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('caps badge at 99+', () => {
        mockUseNotification.mockReturnValue({ unreadCount: 150 });
        render(<NotificationBell />);
        expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('shows dropdown on click', async () => {
        const user = userEvent.setup();
        mockUseNotification.mockReturnValue({ unreadCount: 2 });
        render(<NotificationBell />);
        await user.click(screen.getByLabelText('Notifications (2 unread)'));
        expect(screen.getByText('You have 2 unread notifications')).toBeInTheDocument();
    });

    it('shows no notifications message when count is 0 and dropdown is open', async () => {
        const user = userEvent.setup();
        mockUseNotification.mockReturnValue({ unreadCount: 0 });
        render(<NotificationBell />);
        await user.click(screen.getByLabelText('Notifications'));
        expect(screen.getByText('No new notifications')).toBeInTheDocument();
    });
});
