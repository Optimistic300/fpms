import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PipelineStrip from '../PipelineStrip';

describe('PipelineStrip', () => {
    it('renders four stage boxes', () => {
        render(<PipelineStrip pipeline={{ draft: 5, submitted: 3, inRevision: 2, published: 10 }} />);
        expect(screen.getByText('Draft')).toBeInTheDocument();
        expect(screen.getByText('Submitted')).toBeInTheDocument();
        expect(screen.getByText('In revision')).toBeInTheDocument();
        expect(screen.getByText('Published')).toBeInTheDocument();
    });

    it('displays counts from pipeline prop', () => {
        render(<PipelineStrip pipeline={{ draft: 5, submitted: 3, inRevision: 2, published: 10 }} />);
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('shows 0 when pipeline is null', () => {
        render(<PipelineStrip pipeline={null} />);
        expect(screen.getAllByText('0')).toHaveLength(4);
    });

    it('shows skeleton when loading', () => {
        const { container } = render(<PipelineStrip loading={true} />);
        const skeletons = container.querySelectorAll('[style*="animation"]');
        expect(skeletons.length).toBeGreaterThan(0);
    });
});
