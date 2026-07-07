import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FloatingAIButton from '../FloatingAIButton';

const mockUseAI = vi.fn();

vi.mock('../../../contexts/AIContext', () => ({
    useAI: () => mockUseAI(),
}));

describe('FloatingAIButton', () => {
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
});
