import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MyReports from '../MyReports';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockGet = vi.fn();

vi.mock('../../api/axios', () => ({
    default: {
        get: (...args) => mockGet(...args),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
}));

function renderMyReports() {
    return render(
        <MemoryRouter initialEntries={['/reports']}>
            <MyReports />
        </MemoryRouter>
    );
}

const mockReportsPage1 = {
    data: {
        data: [
            {
                id: 1,
                reportName: 'Q1 2026 Progress Report',
                projectId: 42,
                projectTitle: 'Carbon Stock Assessment',
                period: '2026-01-01 — 2026-03-31',
                type: 'QUARTERLY',
                status: 'PENDING',
                version: 1,
                submittedAt: '2026-04-05T10:00:00Z',
            },
            {
                id: 2,
                reportName: 'Annual Report 2025',
                projectId: 43,
                projectTitle: 'Agroforestry Study',
                period: '2025-01-01 — 2025-12-31',
                type: 'ANNUAL',
                status: 'APPROVED',
                version: 1,
                submittedAt: '2026-01-15T08:30:00Z',
            },
            {
                id: 3,
                reportName: 'Q2 Draft',
                projectId: 42,
                projectTitle: 'Carbon Stock Assessment',
                period: '2026-04-01 — 2026-06-30',
                type: 'QUARTERLY',
                status: 'DRAFT',
                version: 1,
                submittedAt: null,
            },
            {
                id: 4,
                reportName: 'Q3 Returned Report',
                projectId: 44,
                projectTitle: 'Forest Biodiversity',
                period: '2026-07-01 — 2026-09-30',
                type: 'QUARTERLY',
                status: 'RETURNED',
                version: 1,
                submittedAt: '2026-10-01T09:00:00Z',
            },
        ],
        meta: { currentPage: 1, lastPage: 3, perPage: 15, total: 35 },
    },
};

const mockDetailReturned = {
    data: {
        data: {
            id: 4,
            projectId: 44,
            status: 'RETURNED',
            history: [
                { event: 'SUBMITTED', timestamp: '2026-10-01T09:00:00Z', user: 'Researcher' },
                {
                    event: 'RETURNED',
                    timestamp: '2026-10-05T14:00:00Z',
                    user: 'E. Secretary',
                    comment: 'Please add methodology section.',
                },
            ],
        },
    },
};

describe('MyReports', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGet.mockImplementation((url) => {
            if (url === '/reports' || url.startsWith('/reports?')) {
                return Promise.resolve(mockReportsPage1);
            }
            if (url === '/reports/4') {
                return Promise.resolve(mockDetailReturned);
            }
            return Promise.reject(new Error('Unexpected URL'));
        });
    });

    it('renders the page title', async () => {
        renderMyReports();
        await waitFor(() => {
            expect(screen.getByText('My Reports')).toBeInTheDocument();
        });
    });

    it('renders total submission count', async () => {
        renderMyReports();
        await waitFor(() => {
            expect(screen.getByText('35 total submissions')).toBeInTheDocument();
        });
    });

    it('renders needs attention count', async () => {
        renderMyReports();
        await waitFor(() => {
            expect(screen.getByText('1 needs attention')).toBeInTheDocument();
        });
    });

    it('renders new report button', async () => {
        renderMyReports();
        await waitFor(() => {
            expect(screen.getByText('New Report')).toBeInTheDocument();
        });
    });

    it('navigates to new report on button click', async () => {
        const user = userEvent.setup();
        renderMyReports();
        await waitFor(() => {
            expect(screen.getByText('New Report')).toBeInTheDocument();
        });
        await user.click(screen.getByText('New Report'));
        expect(mockNavigate).toHaveBeenCalledWith('/reports/new');
    });

    it('renders all reports', async () => {
        renderMyReports();
        await waitFor(() => {
            expect(screen.getByText('Q1 2026 Progress Report')).toBeInTheDocument();
            expect(screen.getByText('Annual Report 2025')).toBeInTheDocument();
            expect(screen.getByText('Q2 Draft')).toBeInTheDocument();
            expect(screen.getByText('Q3 Returned Report')).toBeInTheDocument();
        });
    });

    it('renders status badges', async () => {
        renderMyReports();
        await waitFor(() => {
            expect(screen.getByText('PENDING')).toBeInTheDocument();
            expect(screen.getByText('APPROVED')).toBeInTheDocument();
            expect(screen.getByText('DRAFT')).toBeInTheDocument();
            expect(screen.getByText('RETURNED')).toBeInTheDocument();
        });
    });

    it('shows action button text per status', async () => {
        renderMyReports();
        await waitFor(() => {
            expect(screen.getByText('Continue')).toBeInTheDocument();
            expect(screen.getByText('View')).toBeInTheDocument();
            expect(screen.getByText('Resubmit')).toBeInTheDocument();
        });
    });

    it('does not show action button for PENDING status', async () => {
        renderMyReports();
        await waitFor(() => {
            const actionButtons = screen.getAllByRole('button');
            const actionLabels = actionButtons
                .map((b) => b.textContent)
                .filter((t) => ['Continue', 'View', 'Resubmit'].includes(t));
            expect(actionLabels.length).toBe(3);
        });
    });

    it('navigates to draft resume on continue click', async () => {
        const user = userEvent.setup();
        renderMyReports();
        await waitFor(() => {
            expect(screen.getByText('Q2 Draft')).toBeInTheDocument();
        });

        const continueBtn = screen.getByText('Continue');
        await user.click(continueBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/reports/new?draft=3');
    });

    it('navigates to resubmit on resubmit click', async () => {
        const user = userEvent.setup();
        renderMyReports();
        await waitFor(() => {
            expect(screen.getByText('Q3 Returned Report')).toBeInTheDocument();
        });

        const resubmitBtn = screen.getByText('Resubmit');
        await user.click(resubmitBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/reports/new?projectId=44&resubmit=4');
    });

    it('expands a returned report and shows timeline with resubmit button', async () => {
        const user = userEvent.setup();
        renderMyReports();
        await waitFor(() => {
            expect(screen.getByText('Q3 Returned Report')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Q3 Returned Report'));

        await waitFor(() => {
            expect(screen.getByText('Submission Timeline')).toBeInTheDocument();
        });
        expect(screen.getAllByText('Submitted').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Returned with comments')).toBeInTheDocument();
        expect(screen.getByText('Please add methodology section.')).toBeInTheDocument();

        const resubmitButtons = screen.getAllByText('Resubmit');
        expect(resubmitButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('shows pagination when there are multiple pages', async () => {
        renderMyReports();
        await waitFor(() => {
            expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
        });
        expect(screen.getByText('Previous')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('disables previous on first page', async () => {
        renderMyReports();
        await waitFor(() => {
            expect(screen.getByText('Previous')).toBeDisabled();
        });
    });

    describe('empty state', () => {
        beforeEach(() => {
            mockGet.mockImplementation((url) => {
                if (url === '/reports' || url.startsWith('/reports?')) {
                    return Promise.resolve({
                        data: { data: [], meta: { currentPage: 1, lastPage: 1, perPage: 15, total: 0 } },
                    });
                }
                return Promise.reject(new Error('Unexpected URL'));
            });
        });

        it('shows empty state when no reports', async () => {
            renderMyReports();
            await waitFor(() => {
                expect(screen.getByText('No reports yet')).toBeInTheDocument();
            });
        });

        it('shows new report button in empty state', async () => {
            renderMyReports();
            await waitFor(() => {
                expect(screen.getAllByText('New Report').length).toBeGreaterThanOrEqual(1);
            });
        });
    });

    describe('error state', () => {
        beforeEach(() => {
            mockGet.mockRejectedValueOnce(new Error('Network error'));
        });

        it('shows error message', async () => {
            renderMyReports();
            await waitFor(() => {
                expect(screen.getByText('Failed to load reports.')).toBeInTheDocument();
            });
        });
    });
});
