import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ComplianceChart from '../ComplianceChart';

const sampleData = [
    { divisionName: 'Forest Ecology', compliancePercentage: 100 },
    { divisionName: 'Wildlife Research', compliancePercentage: 85 },
    { divisionName: 'Climate Change', compliancePercentage: 72 },
];

describe('ComplianceChart', () => {
    it('renders division names and percentages', () => {
        render(<ComplianceChart data={sampleData} loading={false} error={false} />);
        expect(screen.getByText('Forest Ecology')).toBeInTheDocument();
        expect(screen.getByText('Wildlife Research')).toBeInTheDocument();
        expect(screen.getByText('Climate Change')).toBeInTheDocument();
        expect(screen.getByText('100%')).toBeInTheDocument();
        expect(screen.getByText('85%')).toBeInTheDocument();
        expect(screen.getByText('72%')).toBeInTheDocument();
    });

    it('renders section title', () => {
        render(<ComplianceChart data={sampleData} loading={false} error={false} />);
        expect(screen.getByText('Compliance by Division')).toBeInTheDocument();
    });

    it('shows error state', () => {
        render(<ComplianceChart data={[]} loading={false} error={true} />);
        expect(screen.getByText('Failed to load compliance data.')).toBeInTheDocument();
    });

    it('shows empty state', () => {
        render(<ComplianceChart data={[]} loading={false} error={false} />);
        expect(screen.getByText('No compliance data available.')).toBeInTheDocument();
    });

    it('shows skeleton while loading', () => {
        const { container } = render(<ComplianceChart data={[]} loading={true} error={false} />);
        const skeletons = container.querySelectorAll('[style*="border-radius"]');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('handles single division', () => {
        render(<ComplianceChart data={[{ divisionName: 'Forest Ecology', compliancePercentage: 95 }]} loading={false} error={false} />);
        expect(screen.getByText('Forest Ecology')).toBeInTheDocument();
        expect(screen.getByText('95%')).toBeInTheDocument();
    });
});
