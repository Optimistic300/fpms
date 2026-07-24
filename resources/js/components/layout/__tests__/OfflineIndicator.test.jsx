import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import OfflineIndicator from '../OfflineIndicator';

vi.mock('../../../hooks/useOnlineStatus', () => ({
    useOnlineStatus: vi.fn(),
}));

import { useOnlineStatus } from '../../../hooks/useOnlineStatus';

afterEach(() => {
    vi.clearAllMocks();
});

describe('OfflineIndicator', () => {
    it('renders nothing when online', () => {
        useOnlineStatus.mockReturnValue({ isOnline: true });
        const { container } = render(<OfflineIndicator />);
        expect(container.firstChild).toBeNull();
    });

    it('renders offline banner when offline', () => {
        useOnlineStatus.mockReturnValue({ isOnline: false });
        render(<OfflineIndicator />);
        expect(screen.getByText('You are offline. Changes will sync when reconnected.')).toBeInTheDocument();
    });

    it('has role="alert" for accessibility', () => {
        useOnlineStatus.mockReturnValue({ isOnline: false });
        render(<OfflineIndicator />);
        expect(screen.getByRole('alert')).toBeInTheDocument();
    });
});
