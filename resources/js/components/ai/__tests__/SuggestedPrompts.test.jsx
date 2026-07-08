import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SuggestedPrompts from '../SuggestedPrompts';

describe('SuggestedPrompts', () => {
    it('renders default prompts', () => {
        render(<SuggestedPrompts />);
        expect(screen.getByText('What documents are available?')).toBeInTheDocument();
        expect(screen.getByText('Show me recent publications')).toBeInTheDocument();
        expect(screen.getByText('Which projects are researching forest restoration?')).toBeInTheDocument();
    });

    it('calls onSelect with prompt text when clicked', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        render(<SuggestedPrompts onSelect={onSelect} />);
        await user.click(screen.getByText('What documents are available?'));
        expect(onSelect).toHaveBeenCalledWith('What documents are available?');
    });

    it('renders section heading', () => {
        render(<SuggestedPrompts />);
        expect(screen.getByText('Suggested questions')).toBeInTheDocument();
    });
});
