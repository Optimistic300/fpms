import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import DivisionBreakdownTable from '../DivisionBreakdownTable';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const sampleDivisions = [
    { id: 1, name: 'Forest Ecology', head: 'Dr. Adjei', totalProjects: 8, ongoing: 4, activeStaff: 12, documentCount: 45, reportStatusSummary: '3 pending', compliancePercentage: 100 },
    { id: 2, name: 'Wildlife Research', head: 'Dr. Mensah', totalProjects: 5, ongoing: 2, activeStaff: 8, documentCount: 22, reportStatusSummary: '1 overdue', compliancePercentage: 85 },
    { id: 3, name: 'Climate Change', head: 'Dr. Osei', totalProjects: 6, ongoing: 3, activeStaff: 10, documentCount: 30, reportStatusSummary: '2 pending', compliancePercentage: 72 },
];

function renderTable(props = {}) {
    return render(
        <MemoryRouter>
            <DivisionBreakdownTable divisions={sampleDivisions} loading={false} error={false} {...props} />
        </MemoryRouter>
    );
}

describe('DivisionBreakdownTable', () => {
    it('renders division rows with all columns', () => {
        renderTable();
        expect(screen.getByText('Forest Ecology')).toBeInTheDocument();
        expect(screen.getByText('Dr. Adjei')).toBeInTheDocument();
        expect(screen.getAllByText('8').length).toBe(2);
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('45')).toBeInTheDocument();
        expect(screen.getByText('3 pending')).toBeInTheDocument();
        expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('renders all three divisions', () => {
        renderTable();
        expect(screen.getByText('Forest Ecology')).toBeInTheDocument();
        expect(screen.getByText('Wildlife Research')).toBeInTheDocument();
        expect(screen.getByText('Climate Change')).toBeInTheDocument();
    });

    it('navigates to division dashboard on row click', async () => {
        const user = userEvent.setup();
        renderTable();
        await user.click(screen.getByText('Forest Ecology'));
        expect(mockNavigate).toHaveBeenCalledWith('/division?divisionId=1');
    });

    it('shows error state', () => {
        render(
            <MemoryRouter>
                <DivisionBreakdownTable divisions={[]} loading={false} error={true} />
            </MemoryRouter>
        );
        expect(screen.getByText('Failed to load division breakdown.')).toBeInTheDocument();
    });

    it('shows empty state', () => {
        render(
            <MemoryRouter>
                <DivisionBreakdownTable divisions={[]} loading={false} error={false} />
            </MemoryRouter>
        );
        expect(screen.getByText('No division data available.')).toBeInTheDocument();
    });

    it('shows skeleton while loading', () => {
        const { container } = render(
            <MemoryRouter>
                <DivisionBreakdownTable divisions={[]} loading={true} error={false} />
            </MemoryRouter>
        );
        const skeletons = container.querySelectorAll('[style*="border-radius"]');
        expect(skeletons.length).toBeGreaterThan(0);
    });
});
