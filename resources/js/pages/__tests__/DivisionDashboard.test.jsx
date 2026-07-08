import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import DivisionDashboard from '../DivisionDashboard';

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

function renderDashboard(initialEntries = ['/division']) {
    return render(
        <MemoryRouter initialEntries={initialEntries}>
            <DivisionDashboard />
        </MemoryRouter>
    );
}

function setupSuccessfulMocks() {
    mockApiGet.mockImplementation((url) => {
        if (url.includes('/stats')) {
            return Promise.resolve({
                data: {
                    data: { totalProjects: 15, ongoing: 8, reportsPending: 3, reportsOverdue: 1, activeResearchers: 12 },
                },
            });
        }
        if (url.includes('/researcher-activity')) {
            return Promise.resolve({
                data: {
                    data: [
                        { researcherId: 1, fullName: 'Yaa Asantewaa', activeProjects: 3, projects: 'Carbon Stock, Agroforestry', activitiesThisMonth: 8, documentsUploaded: 15, reportStatus: 'SUBMITTED' },
                        { researcherId: 2, fullName: 'Kofi Mensah', activeProjects: 2, projects: 'Soil Analysis', activitiesThisMonth: 4, documentsUploaded: 7, reportStatus: 'OVERDUE' },
                    ],
                },
            });
        }
        if (url.includes('/activity-feed')) {
            return Promise.resolve({
                data: {
                    data: [
                        { type: 'activity', message: 'Yaa Asantewaa logged field data collection', timestamp: '2026-07-01T09:00:00Z', link: '/projects/42' },
                        { type: 'alert', severity: 'warning', message: 'S. Mensah Q2 report overdue', timestamp: '2026-06-28T00:00:00Z', link: '/reports?researcher=2' },
                    ],
                },
            });
        }
        if (url === '/projects' || url.includes('/projects?')) {
            return Promise.resolve({
                data: {
                    data: [
                        { id: 1, title: 'Carbon Stock Assessment', lead: 'Yaa Asantewaa', status: 'ACTIVE', progress: 65 },
                        { id: 2, title: 'Agroforestry Study', lead: 'Kofi Mensah', status: 'PROPOSED', progress: 10 },
                    ],
                    meta: { total: 2 },
                },
            });
        }
        if (url === '/reports' || url.includes('/reports?')) {
            return Promise.resolve({
                data: {
                    data: [
                        { id: 1, reportName: 'Q1 2026 Progress Report', submittedBy: 'Yaa Asantewaa', submittedAt: '2026-04-05T10:00:00Z', status: 'PENDING' },
                        { id: 2, reportName: 'Q2 Report', submittedBy: 'Kofi Mensah', submittedAt: '2026-07-01T14:30:00Z', status: 'APPROVED' },
                    ],
                },
            });
        }
        return Promise.reject(new Error('Unknown URL: ' + url));
    });
}

const authUser = {
    user: { fullName: 'Dr. A. Owusu', division: 'Forest Ecology', divisionId: 1, role: 'DIVISION_HEAD' },
    isAuthenticated: true,
    loading: false,
};

describe('DivisionDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuth.mockReturnValue(authUser);
        setupSuccessfulMocks();
    });

    it('renders page title', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('Division Overview')).toBeInTheDocument();
        });
    });

    it('renders stat cards with values', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('Total Projects')).toBeInTheDocument();
        });
        expect(screen.getByText('Total Projects')).toBeInTheDocument();
        expect(screen.getByText('Ongoing')).toBeInTheDocument();
        expect(screen.getByText('Reports Pending')).toBeInTheDocument();
        expect(screen.getByText('Active Researchers')).toBeInTheDocument();
    });

    it('reports overdue card shows red when >0', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('1')).toBeInTheDocument();
        });
        expect(screen.getByText('Reports Overdue')).toBeInTheDocument();
        expect(screen.getByText('Overdue!')).toBeInTheDocument();
    });

    it('renders projects table', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
        });
        expect(screen.getByText('Agroforestry Study')).toBeInTheDocument();
    });

    it('renders researcher activity table', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('Researcher Activity')).toBeInTheDocument();
        });
        expect(screen.getByText('(2 active)')).toBeInTheDocument();
        expect(screen.getByText('(3 active)')).toBeInTheDocument();
    });

    it('renders activity feed', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('Yaa Asantewaa logged field data collection')).toBeInTheDocument();
        });
        expect(screen.getByText('S. Mensah Q2 report overdue')).toBeInTheDocument();
    });

    it('renders report status panel', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('Q1 2026 Progress Report')).toBeInTheDocument();
        });
        expect(screen.getByText('Q2 Report')).toBeInTheDocument();
    });

    it('renders view all links in projects', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('View all 2 →')).toBeInTheDocument();
        });
    });

    it('renders All reports link', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('All reports →')).toBeInTheDocument();
        });
    });

    it('renders View all → in activity feed', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getAllByText('View all →').length).toBeGreaterThanOrEqual(1);
        });
    });

    it('uses divisionId from query param for management', async () => {
        mockUseAuth.mockReturnValue({
            user: { fullName: 'Management User', division: 'Institute', role: 'MANAGEMENT' },
        });
        setupSuccessfulMocks();

        renderDashboard(['/division?divisionId=2']);

        await waitFor(() => {
            expect(mockApiGet).toHaveBeenCalledWith(
                expect.stringContaining('/divisions/2/stats'),
                expect.any(Object)
            );
        });
    });

    describe('error states', () => {
        beforeEach(() => {
            mockApiGet.mockReset();
            mockUseAuth.mockReturnValue(authUser);
        });

        it('shows error for stats when fetch fails', async () => {
            mockApiGet.mockRejectedValue(new Error('Fail'));
            renderDashboard();
            await waitFor(() => {
                expect(screen.getByText('Failed to load division stats.')).toBeInTheDocument();
            });
        });

        it('shows error for projects when fetch fails', async () => {
            mockApiGet
                .mockResolvedValueOnce({
                    data: { data: { totalProjects: 15, ongoing: 8, reportsPending: 3, reportsOverdue: 1, activeResearchers: 12 } },
                })
                .mockRejectedValueOnce(new Error('Fail'))
                .mockResolvedValueOnce({ data: { data: [] } })
                .mockResolvedValueOnce({ data: { data: [] } })
                .mockResolvedValueOnce({ data: { data: [] } });

            renderDashboard();
            await waitFor(() => {
                expect(screen.getByText('Failed to load projects.')).toBeInTheDocument();
            });
        });

        it('shows error for researcher activity when fetch fails', async () => {
            mockApiGet
                .mockResolvedValueOnce({
                    data: { data: { totalProjects: 15, ongoing: 8, reportsPending: 3, reportsOverdue: 1, activeResearchers: 12 } },
                })
                .mockResolvedValueOnce({ data: { data: [] } })
                .mockRejectedValueOnce(new Error('Fail'))
                .mockResolvedValueOnce({ data: { data: [] } })
                .mockResolvedValueOnce({ data: { data: [] } });

            renderDashboard();
            await waitFor(() => {
                expect(screen.getByText('Failed to load researcher activity.')).toBeInTheDocument();
            });
        });

        it('shows error for reports when fetch fails', async () => {
            mockApiGet
                .mockResolvedValueOnce({
                    data: { data: { totalProjects: 15, ongoing: 8, reportsPending: 3, reportsOverdue: 1, activeResearchers: 12 } },
                })
                .mockResolvedValueOnce({ data: { data: [] } })
                .mockResolvedValueOnce({ data: { data: [] } })
                .mockRejectedValueOnce(new Error('Fail'))
                .mockResolvedValueOnce({ data: { data: [] } });

            renderDashboard();
            await waitFor(() => {
                expect(screen.getByText('Failed to load reports.')).toBeInTheDocument();
            });
        });

        it('shows error for activity feed when fetch fails', async () => {
            mockApiGet
                .mockResolvedValueOnce({
                    data: { data: { totalProjects: 15, ongoing: 8, reportsPending: 3, reportsOverdue: 1, activeResearchers: 12 } },
                })
                .mockResolvedValueOnce({ data: { data: [] } })
                .mockResolvedValueOnce({ data: { data: [] } })
                .mockResolvedValueOnce({ data: { data: [] } })
                .mockRejectedValueOnce(new Error('Fail'));

            renderDashboard();
            await waitFor(() => {
                expect(screen.getByText('Failed to load activity feed.')).toBeInTheDocument();
            });
        });
    });

    describe('empty states', () => {
        beforeEach(() => {
            mockApiGet.mockReset();
            mockUseAuth.mockReturnValue(authUser);
        });

        it('shows empty state when no projects', async () => {
            mockApiGet
                .mockResolvedValueOnce({
                    data: { data: { totalProjects: 15, ongoing: 8, reportsPending: 3, reportsOverdue: 1, activeResearchers: 12 } },
                })
                .mockResolvedValueOnce({ data: { data: [], meta: { total: 0 } } })
                .mockResolvedValueOnce({ data: { data: [{ researcherId: 1, fullName: 'Yaa Asantewaa', activeProjects: 3, projects: 'Carbon Stock', activitiesThisMonth: 8, documentsUploaded: 15, reportStatus: 'SUBMITTED' }] } })
                .mockResolvedValueOnce({ data: { data: [] } })
                .mockResolvedValueOnce({ data: { data: [] } });

            renderDashboard();
            await waitFor(() => {
                expect(screen.getByText('No projects in this division.')).toBeInTheDocument();
            });
        });

        it('shows empty state when no researchers', async () => {
            mockApiGet
                .mockResolvedValueOnce({
                    data: { data: { totalProjects: 15, ongoing: 8, reportsPending: 3, reportsOverdue: 1, activeResearchers: 12 } },
                })
                .mockResolvedValueOnce({ data: { data: [{ id: 1, title: 'Test', lead: 'A', status: 'ACTIVE', progress: 50 }], meta: { total: 1 } } })
                .mockResolvedValueOnce({ data: { data: [] } })
                .mockResolvedValueOnce({ data: { data: [] } })
                .mockResolvedValueOnce({ data: { data: [] } });

            renderDashboard();
            await waitFor(() => {
                expect(screen.getByText('No researchers in this division.')).toBeInTheDocument();
            });
        });

        it('shows empty state when no reports', async () => {
            mockApiGet
                .mockResolvedValueOnce({
                    data: { data: { totalProjects: 15, ongoing: 8, reportsPending: 3, reportsOverdue: 1, activeResearchers: 12 } },
                })
                .mockResolvedValueOnce({ data: { data: [{ id: 1, title: 'Test', lead: 'A', status: 'ACTIVE', progress: 50 }], meta: { total: 1 } } })
                .mockResolvedValueOnce({ data: { data: [{ researcherId: 1, fullName: 'Yaa Asantewaa', activeProjects: 3, projects: 'Carbon Stock', activitiesThisMonth: 8, documentsUploaded: 15, reportStatus: 'SUBMITTED' }] } })
                .mockResolvedValueOnce({ data: { data: [] } })
                .mockResolvedValueOnce({ data: { data: [] } });

            renderDashboard();
            await waitFor(() => {
                expect(screen.getByText('No reports yet.')).toBeInTheDocument();
            });
        });

        it('shows empty state when no activities', async () => {
            mockApiGet
                .mockResolvedValueOnce({
                    data: { data: { totalProjects: 15, ongoing: 8, reportsPending: 3, reportsOverdue: 1, activeResearchers: 12 } },
                })
                .mockResolvedValueOnce({ data: { data: [{ id: 1, title: 'Test', lead: 'A', status: 'ACTIVE', progress: 50 }], meta: { total: 1 } } })
                .mockResolvedValueOnce({ data: { data: [{ researcherId: 1, fullName: 'Yaa Asantewaa', activeProjects: 3, projects: 'Carbon Stock', activitiesThisMonth: 8, documentsUploaded: 15, reportStatus: 'SUBMITTED' }] } })
                .mockResolvedValueOnce({ data: { data: [{ id: 1, reportName: 'R1', submittedBy: 'Yaa', submittedAt: '2026-04-05T10:00:00Z', status: 'PENDING' }] } })
                .mockResolvedValueOnce({ data: { data: [] } });

            renderDashboard();
            await waitFor(() => {
                expect(screen.getByText('No recent activity.')).toBeInTheDocument();
            });
        });
    });

    describe('loading states', () => {
        it('shows skeleton during loading', async () => {
            mockApiGet
                .mockReset()
                .mockReturnValue(new Promise(() => {}));

            renderDashboard();
            const skeletons = document.querySelectorAll('[style*="border-radius"]');
            expect(skeletons.length).toBeGreaterThan(0);
        });
    });

    describe('navigation', () => {
        it('navigates to project detail on row click', async () => {
            const user = userEvent.setup();
            renderDashboard();
            await waitFor(() => {
                expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
            });

            await user.click(screen.getByText('Carbon Stock Assessment'));
            expect(mockNavigate).toHaveBeenCalledWith('/projects/1');
        });

        it('navigates to researcher activities on row click', async () => {
            const user = userEvent.setup();
            renderDashboard();
            await waitFor(() => {
                expect(screen.getByText('(2 active)')).toBeInTheDocument();
            });

            await user.click(screen.getByText('(2 active)'));
            expect(mockNavigate).toHaveBeenCalledWith('/activities?researcher=2');
        });
    });
});
