import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ResearcherActivityTable from '../ResearcherActivityTable';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const sampleResearchers = [
    { researcherId: 1, fullName: 'Yaa Asantewaa', activeProjects: 3, projects: 'Carbon Stock, Agroforestry', activitiesThisMonth: 8, documentsUploaded: 15, reportStatus: 'SUBMITTED' },
    { researcherId: 2, fullName: 'Kofi Mensah', activeProjects: 2, projects: 'Soil Analysis', activitiesThisMonth: 4, documentsUploaded: 7, reportStatus: 'OVERDUE' },
];

function renderComponent(props = {}) {
    return render(
        <MemoryRouter>
            <ResearcherActivityTable
                researchers={[]}
                loading={false}
                error={false}
                {...props}
            />
        </MemoryRouter>
    );
}

describe('ResearcherActivityTable', () => {
    it('renders title', () => {
        renderComponent({ researchers: sampleResearchers });
        expect(screen.getByText('Researcher Activity')).toBeInTheDocument();
    });

    it('renders researcher rows', () => {
        renderComponent({ researchers: sampleResearchers });
        expect(screen.getByText('Yaa Asantewaa')).toBeInTheDocument();
        expect(screen.getByText('Kofi Mensah')).toBeInTheDocument();
    });

    it('renders active project count', () => {
        renderComponent({ researchers: sampleResearchers });
        expect(screen.getByText('(3 active)')).toBeInTheDocument();
        expect(screen.getByText('(2 active)')).toBeInTheDocument();
    });

    it('renders project lists', () => {
        renderComponent({ researchers: sampleResearchers });
        expect(screen.getByText('Carbon Stock, Agroforestry')).toBeInTheDocument();
        expect(screen.getByText('Soil Analysis')).toBeInTheDocument();
    });

    it('renders activity and document counts', () => {
        renderComponent({ researchers: sampleResearchers });
        const eights = screen.getAllByText('8');
        expect(eights.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('renders report status badges', () => {
        renderComponent({ researchers: sampleResearchers });
        expect(screen.getByText('Submitted')).toBeInTheDocument();
        expect(screen.getByText('OVERDUE')).toBeInTheDocument();
    });

    it('navigates to researcher activities on row click', async () => {
        const user = userEvent.setup();
        renderComponent({ researchers: sampleResearchers });
        await user.click(screen.getByText('Yaa Asantewaa'));
        expect(mockNavigate).toHaveBeenCalledWith('/activities?researcher=1');
    });

    it('shows skeleton when loading', () => {
        const { container } = renderComponent({ loading: true });
        const skeletons = container.querySelectorAll('[style*="background-color: rgb(226, 232, 240)"]');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('shows error message when error', () => {
        renderComponent({ error: true });
        expect(screen.getByText('Failed to load researcher activity.')).toBeInTheDocument();
    });

    it('shows empty state when no researchers', () => {
        renderComponent({ researchers: [] });
        expect(screen.getByText('No researchers in this division.')).toBeInTheDocument();
    });

    it('renders Due soon status for DUE_SOON', () => {
        renderComponent({
            researchers: [{ researcherId: 3, fullName: 'Ama Serwaa', activeProjects: 1, projects: 'Forest Survey', activitiesThisMonth: 2, documentsUploaded: 3, reportStatus: 'DUE_SOON' }],
        });
        expect(screen.getByText('Due soon')).toBeInTheDocument();
    });
});
