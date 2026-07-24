import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageBubble from '../MessageBubble';

describe('MessageBubble', () => {
    it('renders user message', () => {
        const message = { id: 1, role: 'user', content: 'Hello from user' };
        render(<MessageBubble message={message} />);
        expect(screen.getByText('Hello from user')).toBeInTheDocument();
    });

    it('renders assistant message', () => {
        const message = { id: 2, role: 'assistant', content: 'Hello from assistant' };
        render(<MessageBubble message={message} />);
        expect(screen.getByText('Hello from assistant')).toBeInTheDocument();
    });

    it('renders citation badges in assistant message', () => {
        const message = {
            id: 2,
            role: 'assistant',
            content: 'Answer with citation [1] here.',
            citations: [{ id: 1, title: 'Doc 1', author: 'Author' }],
        };
        render(<MessageBubble message={message} />);
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText(/View 1 source/)).toBeInTheDocument();
    });

    it('toggles citation cards visibility', async () => {
        const user = userEvent.setup();
        const message = {
            id: 2,
            role: 'assistant',
            content: 'Answer [1].',
            citations: [{ id: 1, title: 'Test Doc', author: 'Author' }],
        };
        render(<MessageBubble message={message} />);
        const toggleBtn = screen.getByText(/View 1 source/);
        await user.click(toggleBtn);
        expect(screen.getByText('Test Doc')).toBeInTheDocument();
        await user.click(toggleBtn);
        expect(screen.queryByText('Test Doc')).not.toBeInTheDocument();
    });

    it('renders follow-up prompts and calls onFollowUpClick', async () => {
        const user = userEvent.setup();
        const onFollowUpClick = vi.fn();
        const message = {
            id: 2,
            role: 'assistant',
            content: 'Answer.',
            followUpPrompts: ['Tell me more', 'Show related'],
        };
        render(<MessageBubble message={message} onFollowUpClick={onFollowUpClick} />);
        expect(screen.getByText('Tell me more')).toBeInTheDocument();
        expect(screen.getByText('Show related')).toBeInTheDocument();
        await user.click(screen.getByText('Tell me more'));
        expect(onFollowUpClick).toHaveBeenCalledWith('Tell me more');
    });

    it('renders cannot-answer buttons', () => {
        const message = {
            id: 2,
            role: 'assistant',
            content: 'I cannot answer.',
            canAnswer: false,
        };
        render(<MessageBubble message={message} />);
        expect(screen.getByText('Browse the library')).toBeInTheDocument();
        expect(screen.getByText('Try different terms')).toBeInTheDocument();
    });

    it('renders honest limits banner when banner is present', () => {
        const message = {
            id: 2,
            role: 'assistant',
            content: 'Answer.',
            banner: 'This is an AI-generated response.',
        };
        render(<MessageBubble message={message} />);
        expect(screen.getByText('This is an AI-generated response.')).toBeInTheDocument();
    });
});
