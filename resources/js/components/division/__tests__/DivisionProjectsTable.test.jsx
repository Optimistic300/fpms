import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import DivisionProjectsTable from '../DivisionProjectsTable';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const sampleProjects = [
    { id: 1, title: 'Carbon Stock Assessment', lead: 'Yaa Asantewaa', status: 'ACTIVE', progress: 65 },
    { id: 2, title: 'Agroforestry Study', lead: 'Kofi Mensah', status: 'PROPOSED', progress: 10 },
];

function renderComponent(props = {}) {
    return render(
        <MemoryRouter>
            <DivisionProjectsTable
                projects={[]}
                loading={false}
                error={false}
                divisionId={1}
                {...props}
            />
        </MemoryRouter>
    );
}

describe('DivisionProjectsTable', () => {
    it('renders title', () => {
        renderComponent({ projects: sampleProjects });
        expect(screen.getByText('Division Projects')).toBeInTheDocument();
    });

    it('renders project rows', () => {
        renderComponent({ projects: sampleProjects });
        expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
        expect(screen.getByText('Agroforestry Study')).toBeInTheDocument();
        expect(screen.getByText('Yaa Asantewaa')).toBeInTheDocument();
        expect(screen.getByText('Kofi Mensah')).toBeInTheDocument();
    });

    it('renders status badges', () => {
        renderComponent({ projects: sampleProjects });
        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
        expect(screen.getByText('PROPOSED')).toBeInTheDocument();
    });

    it('renders progress percentage', () => {
        renderComponent({ projects: sampleProjects });
        expect(screen.getByText('65%')).toBeInTheDocument();
        expect(screen.getByText('10%')).toBeInTheDocument();
    });

    it('renders View all link with count', () => {
        renderComponent({ projects: sampleProjects });
        expect(screen.getByText('View all 2 →')).toBeInTheDocument();
    });

    it('navigates to project detail on row click', async () => {
        const user = userEvent.setup();
        renderComponent({ projects: sampleProjects });
        await user.click(screen.getByText('Carbon Stock Assessment'));
        expect(mockNavigate).toHaveBeenCalledWith('/projects/1');
    });

    it('shows skeleton when loading', () => {
        const { container } = renderComponent({ loading: true });
        const skeletons = container.querySelectorAll('[style*="background-color: rgb(226, 232, 240)"]');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('shows error message when error', () => {
        renderComponent({ error: true });
        expect(screen.getByText('Failed to load projects.')).toBeInTheDocument();
    });

    it('shows empty state when no projects', () => {
        renderComponent({ projects: [] });
        expect(screen.getByText('No projects in this division.')).toBeInTheDocument();
    });
});
