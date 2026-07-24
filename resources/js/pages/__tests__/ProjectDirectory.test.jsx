import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProjectDirectory from '../ProjectDirectory';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockApiGet = vi.fn();
const mockApiPost = vi.fn();

vi.mock('../../api/axios', () => ({
    default: {
        get: (...args) => mockApiGet(...args),
        post: (...args) => mockApiPost(...args),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
}));

const mockProjects = {
    data: {
        data: [
            {
                id: 1,
                title: 'Carbon Stock Assessment',
                division: 'Forest Ecology',
                lead: 'Yaa Asantewaa',
                fundingType: 'DONOR',
                status: 'ACTIVE',
                isOwner: true,
                hasAccess: true,
                isLocked: false,
            },
            {
                id: 2,
                title: 'Agroforestry Study',
                division: 'Forest Ecology',
                lead: 'Kofi Mensah',
                fundingType: 'GOVERNMENT',
                status: 'PROPOSED',
                isOwner: false,
                hasAccess: true,
                isLocked: false,
            },
            {
                id: 3,
                title: 'Biodiversity Survey',
                division: 'Climate Change',
                lead: 'Ama Serwaa',
                fundingType: 'INTERNAL',
                status: 'COMPLETED',
                isOwner: false,
                hasAccess: false,
                isLocked: true,
            },
            {
                id: 4,
                title: 'Soil Analysis',
                division: 'Forest Ecology',
                lead: 'Yaw Asante',
                fundingType: 'DONOR',
                status: 'ACTIVE',
                isOwner: true,
                hasAccess: true,
                isLocked: false,
            },
        ],
        meta: { total: 4 },
    },
};

const mockDivisions = {
    data: {
        data: [
            { divisionId: 1, divisionName: 'Forest Ecology', headName: 'Dr. A. Owusu', totalProjects: 15 },
            { divisionId: 2, divisionName: 'Climate Change', headName: 'Dr. B. Addo', totalProjects: 10 },
        ],
    },
};

function renderProjectDirectory() {
    return render(
        <MemoryRouter initialEntries={['/projects']}>
            <ProjectDirectory />
        </MemoryRouter>
    );
}

describe('ProjectDirectory', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockApiGet
            .mockResolvedValueOnce(mockProjects)
            .mockResolvedValueOnce(mockDivisions);
    });

    it('renders page title and tabs', async () => {
        renderProjectDirectory();
        expect(screen.getByText('Project Directory')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText('All projects')).toBeInTheDocument();
        });
        expect(screen.getByText('My projects')).toBeInTheDocument();
        expect(screen.getByText('Shared with me')).toBeInTheDocument();
    });

    it('renders New Project button', async () => {
        renderProjectDirectory();
        expect(screen.getByText('+ New Project')).toBeInTheDocument();
    });

    it('renders all projects in "All projects" tab', async () => {
        renderProjectDirectory();
        await waitFor(() => {
            expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
        });
        expect(screen.getByText('Agroforestry Study')).toBeInTheDocument();
        expect(screen.getByText('Biodiversity Survey')).toBeInTheDocument();
        expect(screen.getByText('Soil Analysis')).toBeInTheDocument();
    });

    it('shows Mine tag for owned projects', async () => {
        renderProjectDirectory();
        await waitFor(() => {
            const mineTags = screen.getAllByText('Mine');
            expect(mineTags.length).toBe(2);
        });
    });

    it('shows lock icon for locked projects', async () => {
        renderProjectDirectory();
        await waitFor(() => {
            expect(screen.getByTitle('Locked')).toBeInTheDocument();
        });
    });

    it('filters to "My projects" tab', async () => {
        const user = userEvent.setup();
        renderProjectDirectory();
        await waitFor(() => {
            expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
        });

        await user.click(screen.getByText('My projects'));

        expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
        expect(screen.getByText('Soil Analysis')).toBeInTheDocument();
        expect(screen.queryByText('Agroforestry Study')).not.toBeInTheDocument();
        expect(screen.queryByText('Biodiversity Survey')).not.toBeInTheDocument();
    });

    it('filters to "Shared with me" tab', async () => {
        const user = userEvent.setup();
        renderProjectDirectory();
        await waitFor(() => {
            expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Shared with me'));

        expect(screen.getByText('Agroforestry Study')).toBeInTheDocument();
        expect(screen.queryByText('Carbon Stock Assessment')).not.toBeInTheDocument();
        expect(screen.queryByText('Soil Analysis')).not.toBeInTheDocument();
        expect(screen.queryByText('Biodiversity Survey')).not.toBeInTheDocument();
    });

    it('navigates to project detail for accessible project on row click', async () => {
        const user = userEvent.setup();
        renderProjectDirectory();
        await waitFor(() => {
            expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Carbon Stock Assessment'));
        expect(mockNavigate).toHaveBeenCalledWith('/projects/1');
    });

    it('navigates to preview for locked project on row click', async () => {
        const user = userEvent.setup();
        renderProjectDirectory();
        await waitFor(() => {
            expect(screen.getByText('Biodiversity Survey')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Biodiversity Survey'));
        expect(mockNavigate).toHaveBeenCalledWith('/projects/3/preview');
    });

    it('shows empty state for Shared with me tab when no shared projects', async () => {
        mockApiGet.mockReset();
        mockApiGet
            .mockResolvedValueOnce({
                data: {
                    data: [
                        {
                            id: 1,
                            title: 'My Project',
                            division: 'Forest Ecology',
                            lead: 'Me',
                            fundingType: 'DONOR',
                            status: 'ACTIVE',
                            isOwner: true,
                            hasAccess: true,
                            isLocked: false,
                        },
                    ],
                },
            })
            .mockResolvedValueOnce(mockDivisions);

        const user = userEvent.setup();
        renderProjectDirectory();
        await waitFor(() => {
            expect(screen.getByText('My Project')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Shared with me'));

        expect(
            screen.getByText('No projects have been shared with you yet.')
        ).toBeInTheDocument();
    });

    it('opens new project modal when button is clicked', async () => {
        const user = userEvent.setup();
        renderProjectDirectory();
        await waitFor(() => {
            expect(screen.getByText('+ New Project')).toBeInTheDocument();
        });

        await user.click(screen.getByText('+ New Project'));
        expect(screen.getByText('New Project')).toBeInTheDocument();
    });

    it('shows skeleton loading while fetching', async () => {
        mockApiGet
            .mockReset()
            .mockReturnValueOnce(new Promise(() => {}))
            .mockReturnValueOnce(new Promise(() => {}));
        renderProjectDirectory();
        // Wait for render, then verify skeleton rows are present
        expect(screen.getByText('Project Directory')).toBeInTheDocument();
        // Loading skeletons should exist (divs with specific styling)
        const skeletonDivs = document.querySelectorAll('[style*="border-radius"]');
        expect(skeletonDivs.length).toBeGreaterThan(0);
    });

    it('renders status badges for each project', async () => {
        renderProjectDirectory();
        await waitFor(() => {
            const activeBadges = screen.getAllByText('ACTIVE');
            expect(activeBadges.length).toBe(2);
        });
        expect(screen.getByText('PROPOSED')).toBeInTheDocument();
        expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    });
});
