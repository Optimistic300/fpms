import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIProvider, useAI } from '../AIContext';

function TestComponent() {
    const { isOpen, openPanel, closePanel, conversationHistory, setConversationHistory } = useAI();
    return (
        <div>
            <div data-testid="is-open">{String(isOpen)}</div>
            <div data-testid="history-length">{conversationHistory.length}</div>
            <button data-testid="open-btn" onClick={openPanel}>Open</button>
            <button data-testid="close-btn" onClick={closePanel}>Close</button>
            <button data-testid="set-history-btn" onClick={() => setConversationHistory([{ role: 'user', content: 'hi' }])}>
                Set History
            </button>
        </div>
    );
}

function renderWithProvider() {
    return render(
        <AIProvider>
            <TestComponent />
        </AIProvider>
    );
}

describe('AIContext', () => {
    it('provides initial closed state', () => {
        renderWithProvider();
        expect(screen.getByTestId('is-open')).toHaveTextContent('false');
        expect(screen.getByTestId('history-length')).toHaveTextContent('0');
    });

    it('openPanel sets isOpen to true', async () => {
        const user = userEvent.setup();
        renderWithProvider();
        await user.click(screen.getByTestId('open-btn'));
        await waitFor(() => {
            expect(screen.getByTestId('is-open')).toHaveTextContent('true');
        });
    });

    it('closePanel sets isOpen to false', async () => {
        const user = userEvent.setup();
        renderWithProvider();
        await user.click(screen.getByTestId('open-btn'));
        await waitFor(() => {
            expect(screen.getByTestId('is-open')).toHaveTextContent('true');
        });
        await user.click(screen.getByTestId('close-btn'));
        await waitFor(() => {
            expect(screen.getByTestId('is-open')).toHaveTextContent('false');
        });
    });

    it('setConversationHistory updates conversation history', async () => {
        const user = userEvent.setup();
        renderWithProvider();
        await user.click(screen.getByTestId('set-history-btn'));
        await waitFor(() => {
            expect(screen.getByTestId('history-length')).toHaveTextContent('1');
        });
    });

    it('throws error when useAI used outside provider', () => {
        expect(() => render(<TestComponent />)).toThrow(
            'useAI must be used within an AIProvider'
        );
    });
});
