import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FundingBreakdownPanel from '../FundingBreakdownPanel';

const sampleBreakdown = {
    DONOR: 12,
    GOVERNMENT: 8,
    INTERNAL: 5,
};

describe('FundingBreakdownPanel', () => {
    it('renders all three funding types', () => {
        render(<FundingBreakdownPanel breakdown={sampleBreakdown} loading={false} error={false} />);
        expect(screen.getByText('Donor')).toBeInTheDocument();
        expect(screen.getByText('Government')).toBeInTheDocument();
        expect(screen.getByText('Internal')).toBeInTheDocument();
    });

    it('renders project counts', () => {
        render(<FundingBreakdownPanel breakdown={sampleBreakdown} loading={false} error={false} />);
        expect(screen.getByText('12 projects')).toBeInTheDocument();
        expect(screen.getByText('8 projects')).toBeInTheDocument();
        expect(screen.getByText('5 projects')).toBeInTheDocument();
    });

    it('shows error state', () => {
        render(<FundingBreakdownPanel breakdown={null} loading={false} error={true} />);
        expect(screen.getByText('Failed to load funding breakdown.')).toBeInTheDocument();
    });

    it('shows empty state', () => {
        render(<FundingBreakdownPanel breakdown={null} loading={false} error={false} />);
        expect(screen.getByText('No funding data available.')).toBeInTheDocument();
    });

    it('shows skeleton while loading', () => {
        const { container } = render(<FundingBreakdownPanel breakdown={null} loading={true} error={false} />);
        const skeletons = container.querySelectorAll('[style*="border-radius"]');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('handles zero counts gracefully', () => {
        render(<FundingBreakdownPanel breakdown={{ DONOR: 0, GOVERNMENT: 0, INTERNAL: 0 }} loading={false} error={false} />);
        expect(screen.getAllByText(/0 projects?/).length).toBe(3);
    });
});
