import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ExecutiveDashboard from '../ExecutiveDashboard';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

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
        <MemoryRouter initialEntries={['/executive']}>
            <ExecutiveDashboard />
        </MemoryRouter>
    );
}

const mockStats = {
    data: {
        data: {
            totalProjects: 45,
            ongoing: 18,
            divisionsActive: 6,
            reportsPendingReview: 12,
            reportsOverdue: 3,
            libraryDocuments: 230,
        },
    },
};

const mockDivisions = {
    data: {
        data: [
            { id: 1, name: 'Forest Ecology', head: 'Dr. Adjei', totalProjects: 8, ongoing: 4, activeStaff: 12, documentCount: 45, reportStatusSummary: '3 pending', compliancePercentage: 100 },
            { id: 2, name: 'Wildlife Research', head: 'Dr. Mensah', totalProjects: 5, ongoing: 2, activeStaff: 8, documentCount: 22, reportStatusSummary: '1 overdue', compliancePercentage: 85 },
        ],
    },
};

const mockFunding = {
    data: {
        data: { DONOR: 12, GOVERNMENT: 8, INTERNAL: 5 },
    },
};

const mockCompliance = {
    data: {
        data: [
            { divisionName: 'Forest Ecology', compliancePercentage: 100 },
            { divisionName: 'Wildlife Research', compliancePercentage: 85 },
        ],
    },
};

const mockPublications = {
    data: {
        data: [
            { id: 1, title: 'Forest Carbon Dynamics', authors: 'Adjei, K.', journal: 'JFR', date: '2026-06-15', status: 'PUBLISHED' },
        ],
    },
};

const mockAlerts = {
    data: {
        data: [
            { id: 1, message: 'Reports overdue in Forest Ecology', severity: 'danger', type: 'report_overdue', timestamp: '2026-07-08T10:00:00Z', link: '/division?divisionId=1' },
        ],
    },
};

describe('ExecutiveDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockApiGet
            .mockResolvedValueOnce(mockStats)
            .mockResolvedValueOnce(mockDivisions)
            .mockResolvedValueOnce(mockFunding)
            .mockResolvedValueOnce(mockCompliance)
            .mockResolvedValueOnce(mockPublications)
            .mockResolvedValueOnce(mockAlerts);
    });

    it('renders page title', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('Executive Dashboard')).toBeInTheDocument();
        });
    });

    it('renders six stat cards with correct values', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('230')).toBeInTheDocument();
        });
        expect(screen.getAllByText('45').length).toBeGreaterThan(0);
        expect(screen.getByText('18')).toBeInTheDocument();
        expect(screen.getAllByText('6').length).toBeGreaterThan(0);
        expect(screen.getAllByText('12').length).toBeGreaterThan(0);
        expect(screen.getAllByText('3').length).toBeGreaterThan(0);
    });

    it('renders stat card labels', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getAllByText('Total Projects').length).toBeGreaterThan(0);
        });
        expect(screen.getAllByText('Ongoing').length).toBeGreaterThan(0);
        expect(screen.getByText('Divisions Active')).toBeInTheDocument();
        expect(screen.getByText('Reports Pending Review')).toBeInTheDocument();
        expect(screen.getByText('Reports Overdue')).toBeInTheDocument();
        expect(screen.getByText('Library Documents')).toBeInTheDocument();
    });

    it('renders division breakdown table', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getAllByText('Forest Ecology').length).toBeGreaterThan(0);
        });
        expect(screen.getAllByText('Wildlife Research').length).toBeGreaterThan(0);
        expect(screen.getByText('Dr. Adjei')).toBeInTheDocument();
    });

    it('renders funding breakdown panel', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('Donor')).toBeInTheDocument();
        });
        expect(screen.getByText('Government')).toBeInTheDocument();
        expect(screen.getByText('Internal')).toBeInTheDocument();
    });

    it('renders compliance chart', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('Compliance by Division')).toBeInTheDocument();
        });
    });

    it('renders publications panel', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('Forest Carbon Dynamics')).toBeInTheDocument();
        });
        expect(screen.getByText('All publications →')).toBeInTheDocument();
    });

    it('renders institute alerts', async () => {
        renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('Reports overdue in Forest Ecology')).toBeInTheDocument();
        });
    });

    it('shows stat card skeletons before data loads', async () => {
        mockApiGet.mockReset();
        mockApiGet
            .mockReturnValueOnce(new Promise(() => {}))
            .mockReturnValueOnce(new Promise(() => {}))
            .mockReturnValueOnce(new Promise(() => {}))
            .mockReturnValueOnce(new Promise(() => {}))
            .mockReturnValueOnce(new Promise(() => {}))
            .mockReturnValueOnce(new Promise(() => {}));

        renderDashboard();
        const buttonElements = document.querySelectorAll('button');
        // Loading stat cards are buttons, should exist
        expect(buttonElements.length).toBe(0);
        // Skeleton cards are divs with specific styling
        const skeletonDivs = document.querySelectorAll('[style*="animation"]');
        expect(skeletonDivs.length).toBeGreaterThan(0);
    });

    describe('error states', () => {
        it('shows error for stats when fetch fails', async () => {
            mockApiGet.mockReset();
            mockApiGet
                .mockRejectedValueOnce(new Error('Stats error'))
                .mockResolvedValueOnce(mockDivisions)
                .mockResolvedValueOnce(mockFunding)
                .mockResolvedValueOnce(mockCompliance)
                .mockResolvedValueOnce(mockPublications)
                .mockResolvedValueOnce(mockAlerts);

            renderDashboard();
            await waitFor(() => {
                expect(screen.getByText('Failed to load institute stats.')).toBeInTheDocument();
            });
        });

        it('shows error for division table only', async () => {
            mockApiGet.mockReset();
            mockApiGet
                .mockResolvedValueOnce(mockStats)
                .mockRejectedValueOnce(new Error('Divisions error'))
                .mockResolvedValueOnce(mockFunding)
                .mockResolvedValueOnce(mockCompliance)
                .mockResolvedValueOnce(mockPublications)
                .mockResolvedValueOnce(mockAlerts);

            renderDashboard();
            await waitFor(() => {
                expect(screen.getByText('Failed to load division breakdown.')).toBeInTheDocument();
            });
        });

        it('shows error for funding panel only', async () => {
            mockApiGet.mockReset();
            mockApiGet
                .mockResolvedValueOnce(mockStats)
                .mockResolvedValueOnce(mockDivisions)
                .mockRejectedValueOnce(new Error('Funding error'))
                .mockResolvedValueOnce(mockCompliance)
                .mockResolvedValueOnce(mockPublications)
                .mockResolvedValueOnce(mockAlerts);

            renderDashboard();
            await waitFor(() => {
                expect(screen.getByText('Failed to load funding breakdown.')).toBeInTheDocument();
            });
            // Other panels should still work
            expect(screen.getAllByText('Forest Ecology').length).toBeGreaterThan(0);
        });

        it('shows error for publications panel only', async () => {
            mockApiGet.mockReset();
            mockApiGet
                .mockResolvedValueOnce(mockStats)
                .mockResolvedValueOnce(mockDivisions)
                .mockResolvedValueOnce(mockFunding)
                .mockResolvedValueOnce(mockCompliance)
                .mockRejectedValueOnce(new Error('Publications error'))
                .mockResolvedValueOnce(mockAlerts);

            renderDashboard();
            await waitFor(() => {
                expect(screen.getByText('Failed to load publications.')).toBeInTheDocument();
            });
        });

        it('shows error for alerts panel only', async () => {
            mockApiGet.mockReset();
            mockApiGet
                .mockResolvedValueOnce(mockStats)
                .mockResolvedValueOnce(mockDivisions)
                .mockResolvedValueOnce(mockFunding)
                .mockResolvedValueOnce(mockCompliance)
                .mockResolvedValueOnce(mockPublications)
                .mockRejectedValueOnce(new Error('Alerts error'));

            renderDashboard();
            await waitFor(() => {
                expect(screen.getByText('Failed to load alerts.')).toBeInTheDocument();
            });
        });
    });
});
