import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockUseAuth = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
}));

const mockApiGet = vi.fn();

vi.mock('../../api/axios', () => ({
    default: {
        get: (...args) => mockApiGet(...args),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
}));

function renderDashboard() {
    return render(
        <MemoryRouter initialEntries={['/dashboard']}>
            <Dashboard />
        </MemoryRouter>
    );
}

const mockStats = {
    data: {
        data: {
            totalProjects: 12,
            ongoing: 5,
            reportsPending: 2,
            activitiesThisMonth: 8,
        },
    },
};

const mockProjects = {
    data: {
        data: [
            {
                id: 1,
                title: 'Carbon Stock Assessment',
                division: 'Forest Ecology',
                fundingType: 'DONOR',
                status: 'ACTIVE',
                progress: 65,
            },
            {
                id: 2,
                title: 'Agroforestry Study',
                division: 'Forest Ecology',
                fundingType: 'GOVERNMENT',
                status: 'PROPOSED',
                progress: 10,
            },
        ],
        meta: { total: 2 },
    },
};

const mockActivities = {
    data: {
        data: [
            { id: 1, description: 'Field data collection completed', projectTitle: 'Carbon Stock', date: '2026-06-15' },
            { id: 2, description: 'Lab analysis started', projectTitle: 'Agroforestry', date: '2026-06-14' },
            { id: 3, description: 'Community engagement session', projectTitle: 'Carbon Stock', date: '2026-06-10' },
        ],
    },
};

const mockReports = {
    data: {
        data: [
            { id: 1, reportName: 'Q1 2026 Report', projectTitle: 'Carbon Stock', status: 'PENDING' },
            { id: 2, reportName: 'Q2 Mid-year Report', projectTitle: 'Agroforestry', status: 'RETURNED' },
            { id: 3, reportName: 'Annual Summary', projectTitle: 'Carbon Stock', status: 'APPROVED' },
        ],
    },
};

describe('Dashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuth.mockReturnValue({
            user: {
                fullName: 'Yaa Asantewaa',
                division: 'Forest Ecology',
                role: 'RESEARCHER',
            },
            isAuthenticated: true,
            loading: false,
        });
        mockApiGet
            .mockResolvedValueOnce(mockStats)
            .mockResolvedValueOnce(mockProjects)
            .mockResolvedValueOnce(mockActivities)
            .mockResolvedValueOnce(mockReports);
    });

    it('renders greeting with user name', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText(/Welcome/)).toBeInTheDocument();
            expect(screen.getByText(/Yaa/)).toBeInTheDocument();
        });
    });

    it('renders stat cards after loading', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('12')).toBeInTheDocument();
        });
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('renders project table', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
        });
        expect(screen.getByText('Agroforestry Study')).toBeInTheDocument();
    });

    it('renders recent activities', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('Field data collection completed')).toBeInTheDocument();
        });
        expect(screen.getByText('Lab analysis started')).toBeInTheDocument();
        expect(screen.getByText('Community engagement session')).toBeInTheDocument();
    });

    it('renders report status panel', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('Q1 2026 Report')).toBeInTheDocument();
        });
        expect(screen.getByText('Q2 Mid-year Report')).toBeInTheDocument();
        expect(screen.getByText('Annual Summary')).toBeInTheDocument();
    });

    it('renders View all links', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getAllByText('View all').length).toBe(2);
        });
    });

    it('renders stat card skeleton before data loads', async () => {
        // Delay mock resolution to test skeleton state
        mockApiGet
            .mockReset()
            .mockReturnValueOnce(new Promise(() => {})) // never resolves
            .mockReturnValueOnce(new Promise(() => {}))
            .mockReturnValueOnce(new Promise(() => {}))
            .mockReturnValueOnce(new Promise(() => {}));

        renderDashboard();
        // Should show skeleton cards (rendered as stat card skeleton divs)
        const skeletonDivs = document.querySelectorAll('[style*="border-radius"]');
        expect(skeletonDivs.length).toBeGreaterThan(0);
    });

    it('handles stat card click for totalProjects', async () => {
        const user = userEvent.setup();
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('12')).toBeInTheDocument();
        });

        const statButtons = screen.getAllByRole('button');
        const myProjectsBtn = statButtons.find((btn) => btn.textContent.includes('My Projects'));
        await user.click(myProjectsBtn);
        // Click again to toggle
        await user.click(myProjectsBtn);
    });

    it('navigates to reports when reports pending card is clicked', async () => {
        const user = userEvent.setup();
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('2')).toBeInTheDocument();
        });

        const statButtons = screen.getAllByRole('button');
        const reportsBtn = statButtons.find((btn) => btn.textContent.includes('Reports Pending'));
        await user.click(reportsBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/reports?status=PENDING');
    });

    it('navigates to activities when activities card is clicked', async () => {
        const user = userEvent.setup();
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('8')).toBeInTheDocument();
        });

        const statButtons = screen.getAllByRole('button');
        const activitiesBtn = statButtons.find((btn) => btn.textContent.includes('Activities This Month'));
        await user.click(activitiesBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/activities?period=this-month');
    });

    it('navigates to project detail on row click', async () => {
        const user = userEvent.setup();
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Carbon Stock Assessment'));
        expect(mockNavigate).toHaveBeenCalledWith('/projects/1');
    });

    it('filters projects by search', async () => {
        const user = userEvent.setup();
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Search by title...');
        await user.type(searchInput, 'Agro');

        await waitFor(
            () => {
                expect(screen.queryByText('Carbon Stock Assessment')).not.toBeInTheDocument();
            },
            { timeout: 500 }
        );
    });

    describe('error states', () => {
        beforeEach(() => {
            mockApiGet.mockReset();
            mockUseAuth.mockReturnValue({
                user: { fullName: 'Yaa Asantewaa', division: 'Forest Ecology', role: 'RESEARCHER' },
            });
        });

        it('shows error for stats when fetch fails', async () => {
            mockApiGet
                .mockRejectedValueOnce(new Error('Stats error'))
                .mockResolvedValueOnce(mockProjects)
                .mockResolvedValueOnce(mockActivities)
                .mockResolvedValueOnce(mockReports);

            renderDashboard();
            await waitFor(() => {
                expect(screen.getByText('Failed to load stats.')).toBeInTheDocument();
            });
        });

        it('shows error for projects when fetch fails', async () => {
            mockApiGet
                .mockResolvedValueOnce(mockStats)
                .mockRejectedValueOnce(new Error('Projects error'))
                .mockResolvedValueOnce(mockActivities)
                .mockResolvedValueOnce(mockReports);

            renderDashboard();
            await waitFor(() => {
                expect(screen.getByText('Failed to load projects.')).toBeInTheDocument();
            });
        });

        it('shows error for activities when fetch fails', async () => {
            mockApiGet
                .mockResolvedValueOnce(mockStats)
                .mockResolvedValueOnce(mockProjects)
                .mockRejectedValueOnce(new Error('Activities error'))
                .mockResolvedValueOnce(mockReports);

            renderDashboard();
            await waitFor(() => {
                expect(screen.getByText('Failed to load activities.')).toBeInTheDocument();
            });
        });

        it('shows error for reports when fetch fails', async () => {
            mockApiGet
                .mockResolvedValueOnce(mockStats)
                .mockResolvedValueOnce(mockProjects)
                .mockResolvedValueOnce(mockActivities)
                .mockRejectedValueOnce(new Error('Reports error'));

            renderDashboard();
            await waitFor(() => {
                expect(screen.getByText('Failed to load reports.')).toBeInTheDocument();
            });
        });
    });

    describe('empty states', () => {
        beforeEach(() => {
            mockApiGet.mockReset();
            mockUseAuth.mockReturnValue({
                user: { fullName: 'Yaa Asantewaa', division: 'Forest Ecology', role: 'RESEARCHER' },
            });
        });

        it('shows empty state when no projects', async () => {
            mockApiGet
                .mockResolvedValueOnce(mockStats)
                .mockResolvedValueOnce({ data: { data: [], meta: { total: 0 } } })
                .mockResolvedValueOnce(mockActivities)
                .mockResolvedValueOnce(mockReports);

            renderDashboard();
            await waitFor(() => {
                expect(
                    screen.getByText("You don't have any projects yet.")
                ).toBeInTheDocument();
            });
            expect(
                screen.getByText('Create your first project')
            ).toBeInTheDocument();
        });

        it('shows empty state when no activities', async () => {
            mockApiGet
                .mockResolvedValueOnce(mockStats)
                .mockResolvedValueOnce(mockProjects)
                .mockResolvedValueOnce({ data: { data: [] } })
                .mockResolvedValueOnce(mockReports);

            renderDashboard();
            await waitFor(() => {
                expect(screen.getByText('No recent activities.')).toBeInTheDocument();
            });
        });

        it('shows empty state when no reports', async () => {
            mockApiGet
                .mockResolvedValueOnce(mockStats)
                .mockResolvedValueOnce(mockProjects)
                .mockResolvedValueOnce(mockActivities)
                .mockResolvedValueOnce({ data: { data: [] } });

            renderDashboard();
            await waitFor(() => {
                expect(screen.getByText('No reports yet.')).toBeInTheDocument();
            });
        });
    });
});
