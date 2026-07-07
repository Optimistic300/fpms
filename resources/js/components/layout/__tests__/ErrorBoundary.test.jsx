import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

const ThrowError = () => {
    throw new Error('Test error');
};

describe('ErrorBoundary', () => {
    it('renders children when no error', () => {
        render(
            <ErrorBoundary>
                <div data-testid="child">OK</div>
            </ErrorBoundary>
        );
        expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('shows fallback UI when child throws', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        render(
            <ErrorBoundary>
                <ThrowError />
            </ErrorBoundary>
        );
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByText('Please refresh the page to continue.')).toBeInTheDocument();
        expect(screen.getByText('Refresh Page')).toBeInTheDocument();
        console.error.mockRestore();
    });
});
