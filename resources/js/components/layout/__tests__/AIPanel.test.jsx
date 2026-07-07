import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIPanel from '../AIPanel';

const mockUseAI = vi.fn();

vi.mock('../../../contexts/AIContext', () => ({
    useAI: () => mockUseAI(),
}));

describe('AIPanel', () => {
    it('does not render when isOpen is false', () => {
        mockUseAI.mockReturnValue({ isOpen: false, closePanel: vi.fn() });
        const { container } = render(<AIPanel />);
        expect(container.innerHTML).toBe('');
    });

    it('renders panel when isOpen is true', () => {
        mockUseAI.mockReturnValue({ isOpen: true, closePanel: vi.fn() });
        render(<AIPanel />);
        expect(screen.getByText('Ask SKMS')).toBeInTheDocument();
        expect(screen.getByText('Coming soon')).toBeInTheDocument();
    });

    it('calls closePanel when close button is clicked', async () => {
        const user = userEvent.setup();
        const closePanel = vi.fn();
        mockUseAI.mockReturnValue({ isOpen: true, closePanel });
        render(<AIPanel />);
        await user.click(screen.getByLabelText('Close AI panel'));
        expect(closePanel).toHaveBeenCalledOnce();
    });

    it('calls closePanel when clicking outside the panel', async () => {
        const user = userEvent.setup();
        const closePanel = vi.fn();
        mockUseAI.mockReturnValue({ isOpen: true, closePanel });
        const { container } = render(<AIPanel />);
        const backdropDiv = container.querySelector('div:first-child');
        await user.click(backdropDiv);
        expect(closePanel).toHaveBeenCalledOnce();
    });
});
