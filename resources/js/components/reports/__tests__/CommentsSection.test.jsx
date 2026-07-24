import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommentsSection from '../CommentsSection';

function renderComments(comments = [], onSubmitComment) {
    return render(<CommentsSection comments={comments} onSubmitComment={onSubmitComment} />);
}

describe('CommentsSection', () => {
    it('renders comment count', () => {
        renderComments([]);
        expect(screen.getByText('Comments (0)')).toBeInTheDocument();
    });

    it('shows empty message when no comments', () => {
        renderComments([]);
        expect(screen.getByText('No comments yet.')).toBeInTheDocument();
    });

    it('renders list of comments', () => {
        const comments = [
            { id: 1, user: 'E. Secretary', createdAt: '2026-04-07T14:30:00Z', body: 'Please revise.' },
            { id: 2, user: 'Researcher', createdAt: '2026-04-10T09:00:00Z', body: 'Updated as requested.' },
        ];
        renderComments(comments);
        expect(screen.getByText('E. Secretary')).toBeInTheDocument();
        expect(screen.getByText('Researcher')).toBeInTheDocument();
        expect(screen.getByText('Please revise.')).toBeInTheDocument();
        expect(screen.getByText('Updated as requested.')).toBeInTheDocument();
        expect(screen.getByText('Comments (2)')).toBeInTheDocument();
    });

    it('renders comment form when onSubmitComment is provided', () => {
        renderComments([], vi.fn());
        expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
        expect(screen.getByText('Post Comment')).toBeInTheDocument();
    });

    it('does not render form when onSubmitComment is not provided', () => {
        renderComments([]);
        expect(screen.queryByPlaceholderText('Add a comment...')).not.toBeInTheDocument();
    });

    it('calls onSubmitComment with text on form submit', async () => {
        const onSubmit = vi.fn(() => Promise.resolve());
        const user = userEvent.setup();
        renderComments([], onSubmit);
        const textarea = screen.getByPlaceholderText('Add a comment...');
        await user.type(textarea, 'Great work!');
        await user.click(screen.getByText('Post Comment'));
        expect(onSubmit).toHaveBeenCalledWith('Great work!');
    });
});