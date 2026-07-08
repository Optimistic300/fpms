import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PublicationsPanel from '../PublicationsPanel';

const samplePublications = [
    { id: 1, title: 'Forest Carbon Dynamics in Ghana', authors: 'Adjei, K.; Mensah, P.', journal: 'Journal of Forest Research', date: '2026-06-15', status: 'PUBLISHED' },
    { id: 2, title: 'Agroforestry Impact Assessment', authors: 'Osei, D.', journal: 'Agroforestry Systems', date: '2026-05-20', status: 'SUBMITTED' },
];

function renderPanel(props = {}) {
    return render(
        <MemoryRouter>
            <PublicationsPanel publications={samplePublications} loading={false} error={false} {...props} />
        </MemoryRouter>
    );
}

describe('PublicationsPanel', () => {
    it('renders publication titles and authors', () => {
        renderPanel();
        expect(screen.getByText('Forest Carbon Dynamics in Ghana')).toBeInTheDocument();
        expect(screen.getByText('Adjei, K.; Mensah, P.')).toBeInTheDocument();
        expect(screen.getByText('Agroforestry Impact Assessment')).toBeInTheDocument();
    });

    it('renders status badges', () => {
        renderPanel();
        expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
        expect(screen.getByText('SUBMITTED')).toBeInTheDocument();
    });

    it('shows error state', () => {
        render(
            <MemoryRouter>
                <PublicationsPanel publications={[]} loading={false} error={true} />
            </MemoryRouter>
        );
        expect(screen.getByText('Failed to load publications.')).toBeInTheDocument();
    });

    it('shows empty state', () => {
        render(
            <MemoryRouter>
                <PublicationsPanel publications={[]} loading={false} error={false} />
            </MemoryRouter>
        );
        expect(screen.getByText('No publications yet.')).toBeInTheDocument();
    });

    it('renders All publications link', () => {
        renderPanel();
        const link = screen.getByText('All publications →');
        expect(link).toBeInTheDocument();
        expect(link.closest('a')).toHaveAttribute('href', '/publications');
    });

    it('shows skeleton while loading', () => {
        const { container } = render(
            <MemoryRouter>
                <PublicationsPanel publications={[]} loading={true} error={false} />
            </MemoryRouter>
        );
        const skeletons = container.querySelectorAll('[style*="border-radius"]');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('handles journal and date display', () => {
        renderPanel();
        expect(screen.getByText('Journal of Forest Research')).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('Jun 15, 2026'))).toBeInTheDocument();
    });
});
