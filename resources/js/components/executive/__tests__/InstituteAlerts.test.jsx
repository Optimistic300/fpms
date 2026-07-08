import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import InstituteAlerts from '../InstituteAlerts';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const sampleAlerts = [
    { id: 1, message: 'Reports overdue in Forest Ecology', severity: 'danger', type: 'report_overdue', timestamp: '2026-07-08T10:00:00Z', link: '/division?divisionId=1' },
    { id: 2, message: 'Secretary queue backlog above threshold', severity: 'warning', type: 'queue_backlog', timestamp: '2026-07-07T14:30:00Z', link: '/queue' },
    { id: 3, message: 'All reports submitted for Wildlife Research', severity: 'success', type: 'milestone', timestamp: '2026-07-06T09:00:00Z' },
    { id: 4, message: 'Library document count reaches 500', severity: 'info', type: 'document_milestone', timestamp: '2026-07-05T16:00:00Z', link: '/library' },
];

function renderAlerts(props = {}) {
    return render(
        <MemoryRouter>
            <InstituteAlerts alerts={sampleAlerts} loading={false} error={false} {...props} />
        </MemoryRouter>
    );
}

describe('InstituteAlerts', () => {
    it('renders all alert messages', () => {
        renderAlerts();
        expect(screen.getByText('Reports overdue in Forest Ecology')).toBeInTheDocument();
        expect(screen.getByText('Secretary queue backlog above threshold')).toBeInTheDocument();
        expect(screen.getByText('All reports submitted for Wildlife Research')).toBeInTheDocument();
        expect(screen.getByText('Library document count reaches 500')).toBeInTheDocument();
    });

    it('navigates on arrow button click when link exists', async () => {
        const user = userEvent.setup();
        renderAlerts();
        const buttons = screen.getAllByRole('button', { name: /navigate/i });
        await user.click(buttons[0]);
        expect(mockNavigate).toHaveBeenCalledWith('/division?divisionId=1');
    });

    it('shows error state', () => {
        render(
            <MemoryRouter>
                <InstituteAlerts alerts={[]} loading={false} error={true} />
            </MemoryRouter>
        );
        expect(screen.getByText('Failed to load alerts.')).toBeInTheDocument();
    });

    it('shows empty state', () => {
        render(
            <MemoryRouter>
                <InstituteAlerts alerts={[]} loading={false} error={false} />
            </MemoryRouter>
        );
        expect(screen.getByText('No alerts at this time.')).toBeInTheDocument();
    });

    it('shows skeleton while loading', () => {
        const { container } = render(
            <MemoryRouter>
                <InstituteAlerts alerts={[]} loading={true} error={false} />
            </MemoryRouter>
        );
        const skeletons = container.querySelectorAll('[style*="border-radius"]');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders relative timestamps', () => {
        renderAlerts();
        const timeElements = screen.getAllByText(/m ago|h ago/);
        expect(timeElements.length).toBeGreaterThan(0);
    });
});
