import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationProvider, useNotification } from '../NotificationContext';

const mockGet = vi.fn();

vi.mock('../../api/axios', () => ({
    default: {
        get: (...args) => mockGet(...args),
        post: vi.fn(),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
}));

function TestComponent() {
    const { unreadCount, refreshCount } = useNotification();
    return (
        <div>
            <div data-testid="unread-count">{unreadCount}</div>
            <button data-testid="refresh-btn" onClick={refreshCount}>Refresh</button>
        </div>
    );
}

function renderWithProvider() {
    return render(
        <NotificationProvider>
            <TestComponent />
        </NotificationProvider>
    );
}

describe('NotificationContext', () => {
    beforeEach(() => {
        mockGet.mockReset();
    });

    it('provides initial unread count and fetches from API', async () => {
        mockGet.mockResolvedValueOnce({
            data: { meta: { unreadCount: 5 } },
        });
        renderWithProvider();
        await waitFor(() => {
            expect(screen.getByTestId('unread-count')).toHaveTextContent('5');
        });
        expect(mockGet).toHaveBeenCalledWith('/inbox', {
            params: { page: 1, limit: 1 },
        });
    });

    it('handles API failure gracefully', async () => {
        mockGet.mockRejectedValueOnce(new Error('Network error'));
        renderWithProvider();
        await waitFor(() => {
            expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
        });
    });

    it('refreshCount can be called manually', async () => {
        const user = userEvent.setup();
        mockGet.mockResolvedValue({
            data: { meta: { unreadCount: 7 } },
        });
        renderWithProvider();
        await waitFor(() => {
            expect(screen.getByTestId('unread-count')).toHaveTextContent('7');
        });
        mockGet.mockResolvedValueOnce({
            data: { meta: { unreadCount: 2 } },
        });
        await user.click(screen.getByTestId('refresh-btn'));
        await waitFor(() => {
            expect(screen.getByTestId('unread-count')).toHaveTextContent('2');
        });
    });

    it('throws error when useNotification used outside provider', () => {
        expect(() => render(<TestComponent />)).toThrow(
            'useNotification must be used within a NotificationProvider'
        );
    });
});
