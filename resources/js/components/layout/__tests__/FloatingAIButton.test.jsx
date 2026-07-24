import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FloatingAIButton from '../FloatingAIButton';

const mockUseAI = vi.fn();
const mockUseOnlineStatus = vi.fn();

vi.mock('../../../contexts/AIContext', () => ({
    useAI: () => mockUseAI(),
}));

vi.mock('../../../hooks/useOnlineStatus', () => ({
    useOnlineStatus: () => mockUseOnlineStatus(),
}));

describe('FloatingAIButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseOnlineStatus.mockReturnValue({ isOnline: true });
    });

    it('renders AI button', () => {
        mockUseAI.mockReturnValue({ openPanel: vi.fn() });
        render(<FloatingAIButton />);
        expect(screen.getByLabelText('Ask SKMS')).toBeInTheDocument();
    });

    it('calls openPanel on click', async () => {
        const user = userEvent.setup();
        const openPanel = vi.fn();
        mockUseAI.mockReturnValue({ openPanel });
        render(<FloatingAIButton />);
        await user.click(screen.getByLabelText('Ask SKMS'));
        expect(openPanel).toHaveBeenCalledOnce();
    });

    it('shows label on hover', async () => {
        const user = userEvent.setup();
        mockUseAI.mockReturnValue({ openPanel: vi.fn() });
        render(<FloatingAIButton />);
        await user.hover(screen.getByLabelText('Ask SKMS'));
        expect(screen.getByText('Ask SKMS')).toBeInTheDocument();
    });

    it('shows offline indicator when offline', async () => {
        mockUseOnlineStatus.mockReturnValue({ isOnline: false });
        mockUseAI.mockReturnValue({ openPanel: vi.fn() });
        render(<FloatingAIButton />);
        expect(screen.getByLabelText('Offline')).toBeInTheDocument();
    });
});
