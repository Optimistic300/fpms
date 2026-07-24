import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIPanel from '../AIPanel';

const mockUseAI = vi.fn();
const mockUseOnlineStatus = vi.fn();
const mockUseAiQuestionQueue = vi.fn();

vi.mock('../../../contexts/AIContext', () => ({
    useAI: () => mockUseAI(),
}));

vi.mock('../../../hooks/useOnlineStatus', () => ({
    useOnlineStatus: () => mockUseOnlineStatus(),
}));

vi.mock('../../../hooks/useAiQuestionQueue', () => ({
    useAiQuestionQueue: () => mockUseAiQuestionQueue(),
}));

vi.mock('../../../services/axios', () => ({
    default: { post: vi.fn() },
}));

describe('AIPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseOnlineStatus.mockReturnValue({ isOnline: true });
        mockUseAiQuestionQueue.mockReturnValue({ submitQuestion: vi.fn().mockResolvedValue({ sent: true }), queuedCount: 0 });
    });

    it('does not render when isOpen is false', () => {
        mockUseAI.mockReturnValue({ isOpen: false, closePanel: vi.fn(), conversationHistory: [], setConversationHistory: vi.fn() });
        const { container } = render(<AIPanel />);
        expect(container.innerHTML).toBe('');
    });

    it('renders panel when isOpen is true', () => {
        mockUseAI.mockReturnValue({ isOpen: true, closePanel: vi.fn(), conversationHistory: [], setConversationHistory: vi.fn() });
        render(<AIPanel />);
        expect(screen.getByText('Ask SKMS')).toBeInTheDocument();
    });

    it('calls closePanel when close button is clicked', async () => {
        const user = userEvent.setup();
        const closePanel = vi.fn();
        mockUseAI.mockReturnValue({ isOpen: true, closePanel, conversationHistory: [], setConversationHistory: vi.fn() });
        render(<AIPanel />);
        await user.click(screen.getByLabelText('Close AI panel'));
        expect(closePanel).toHaveBeenCalledOnce();
    });

    it('calls closePanel when clicking outside the panel', async () => {
        const user = userEvent.setup();
        const closePanel = vi.fn();
        mockUseAI.mockReturnValue({ isOpen: true, closePanel, conversationHistory: [], setConversationHistory: vi.fn() });
        const { container } = render(<AIPanel />);
        const backdrop = container.querySelector('div[aria-hidden="true"]');
        await user.click(backdrop);
        expect(closePanel).toHaveBeenCalledOnce();
    });

    it('shows empty state with suggested prompts', () => {
        mockUseAI.mockReturnValue({ isOpen: true, closePanel: vi.fn(), conversationHistory: [], setConversationHistory: vi.fn() });
        render(<AIPanel />);
        expect(screen.getByText('Suggested questions')).toBeInTheDocument();
        expect(screen.getByText('What documents are available?')).toBeInTheDocument();
    });

    it('shows header with title and subtitle', () => {
        mockUseAI.mockReturnValue({ isOpen: true, closePanel: vi.fn(), conversationHistory: [], setConversationHistory: vi.fn() });
        render(<AIPanel />);
        expect(screen.getByText('Ask SKMS')).toBeInTheDocument();
        expect(screen.getByText(/Searches across all library documents/)).toBeInTheDocument();
    });

    it('shows conversation history messages', () => {
        const messages = [
            { id: 1, role: 'user', content: 'What is this?' },
            { id: 2, role: 'assistant', content: 'This is a test.' },
        ];
        mockUseAI.mockReturnValue({ isOpen: true, closePanel: vi.fn(), conversationHistory: messages, setConversationHistory: vi.fn() });
        render(<AIPanel />);
        expect(screen.getByText('What is this?')).toBeInTheDocument();
        expect(screen.getByText('This is a test.')).toBeInTheDocument();
    });

    it('shows new conversation button when there are messages', () => {
        const messages = [{ id: 1, role: 'user', content: 'Hi' }];
        mockUseAI.mockReturnValue({ isOpen: true, closePanel: vi.fn(), conversationHistory: messages, setConversationHistory: vi.fn() });
        render(<AIPanel />);
        expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('submits a question via textarea', async () => {
        const user = userEvent.setup();
        const setConversationHistory = vi.fn();
        const submitQuestion = vi.fn().mockResolvedValue({ sent: true });
        mockUseAiQuestionQueue.mockReturnValue({ submitQuestion, queuedCount: 0 });
        mockUseAI.mockReturnValue({ isOpen: true, closePanel: vi.fn(), conversationHistory: [], setConversationHistory });

        const axios = await import('../../../services/axios');
        axios.default.post.mockResolvedValue({
            data: { data: { answer: 'Test answer', citations: [], followUpPrompts: [], canAnswer: true, banner: null } },
        });

        render(<AIPanel />);
        const textarea = screen.getByPlaceholderText('Ask a question...');
        await user.type(textarea, 'What is this?');
        await user.keyboard('{Enter}');

        await waitFor(() => {
            expect(submitQuestion).toHaveBeenCalledWith('What is this?');
        });
    });

    it('closes on Escape key', async () => {
        const user = userEvent.setup();
        const closePanel = vi.fn();
        mockUseAI.mockReturnValue({ isOpen: true, closePanel, conversationHistory: [], setConversationHistory: vi.fn() });
        render(<AIPanel />);
        await user.keyboard('{Escape}');
        expect(closePanel).toHaveBeenCalled();
    });
});
