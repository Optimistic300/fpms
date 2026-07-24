import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HonestLimitsBanner from '../HonestLimitsBanner';

describe('HonestLimitsBanner', () => {
    it('renders with provided text', () => {
        render(<HonestLimitsBanner text="Custom notice text" />);
        expect(screen.getByText('Custom notice text')).toBeInTheDocument();
    });

    it('renders with default text when none provided', () => {
        render(<HonestLimitsBanner />);
        expect(screen.getByText(/always verify/i)).toBeInTheDocument();
    });

    it('has correct aria role', () => {
        render(<HonestLimitsBanner text="Notice" />);
        expect(screen.getByRole('note')).toBeInTheDocument();
    });
});
