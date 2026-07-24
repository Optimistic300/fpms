import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TypingIndicator from '../TypingIndicator';

describe('TypingIndicator', () => {
    it('renders three animated dots', () => {
        const { container } = render(<TypingIndicator />);
        const dots = container.querySelectorAll('div[style*="animation"]');
        expect(dots).toHaveLength(3);
    });

    it('has accessible role', () => {
        render(<TypingIndicator />);
        expect(screen.getByRole('status')).toBeInTheDocument();
    });
});
