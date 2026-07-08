import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ReportQueue from '../ReportQueue';

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
        patch: vi.fn(),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
}));

function renderReportQueue() {
    return render(
        <MemoryRouter initialEntries={['/queue']}>
            <ReportQueue />
        </MemoryRouter>
    );
}

const mockStats = {
    data: {
        data: {
            overdue: 2,
            pending: 10,
            approvedThisQuarter: 28,
            returned: 4,
        },
    },
};

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
                submittedBy: 'Yaa Asantewaa',
                division: 'Forest Ecology',
                submittedAt: '2026-04-05T10:00:00Z',
                daysWaiting: 3,
            },
            {
                id: 2,
                reportName: 'Q2 Overdue Report',
                projectId: 43,
                projectTitle: 'Agroforestry Study',
                period: '2026-04-01 — 2026-06-30',
                type: 'ANNUAL',
                status: 'PENDING',
                version: 1,
                submittedBy: 'Kofi Mensah',
                division: 'Forest Engineering',
                submittedAt: '2026-03-01T08:00:00Z',
                daysWaiting: 15,
            },
        ],
        meta: { currentPage: 1, lastPage: 1, perPage: 20, total: 2 },
    },
};

describe('ReportQueue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGet.mockImplementation((url) => {
            if (url === '/reports/stats') return Promise.resolve(mockStats);
            if (url.includes('/reports?') || url === '/reports') return Promise.resolve(mockReportsPage1);
            return Promise.reject(new Error('Unexpected URL: ' + url));
        });
    });

    it('renders the page title', async () => {
        renderReportQueue();
        await waitFor(() => {
            expect(screen.getByText('Report Queue')).toBeInTheDocument();
        });
    });

    it('renders stat cards with correct values', async () => {
        renderReportQueue();
        await waitFor(() => {
            expect(screen.getByText('2')).toBeInTheDocument();
            expect(screen.getByText('10')).toBeInTheDocument();
            expect(screen.getByText('28')).toBeInTheDocument();
            expect(screen.getByText('4')).toBeInTheDocument();
        });
        expect(screen.getByText('Pending review')).toBeInTheDocument();
        expect(screen.getByText('Approved this quarter')).toBeInTheDocument();
        expect(screen.getByText('Returned for revision')).toBeInTheDocument();
    });

    it('renders report rows in the table', async () => {
        renderReportQueue();
        await waitFor(() => {
            expect(screen.getByText('Q1 2026 Progress Report')).toBeInTheDocument();
            expect(screen.getByText('Q2 Overdue Report')).toBeInTheDocument();
        });
    });

    it('shows overdue badge for reports with >7 days waiting', async () => {
        renderReportQueue();
        await waitFor(() => {
            expect(screen.getAllByText('Overdue').length).toBeGreaterThanOrEqual(1);
        });
    });

    it('shows Review buttons for each report', async () => {
        renderReportQueue();
        await waitFor(() => {
            expect(screen.getAllByText('Review').length).toBe(2);
        });
    });

    it('navigates to review on row click', async () => {
        const user = userEvent.setup();
        renderReportQueue();
        await waitFor(() => {
            expect(screen.getByText('Q1 2026 Progress Report')).toBeInTheDocument();
        });
        await user.click(screen.getByText('Q1 2026 Progress Report'));
        expect(mockNavigate).toHaveBeenCalledWith('/queue/1');
    });

    it('navigates to review on Review button click', async () => {
        const user = userEvent.setup();
        renderReportQueue();
        await waitFor(() => {
            expect(screen.getAllByText('Review').length).toBe(2);
        });
        await user.click(screen.getAllByText('Review')[0]);
        expect(mockNavigate).toHaveBeenCalledWith('/queue/1');
    });

    it('shows empty state when no reports', async () => {
        mockGet.mockImplementation((url) => {
            if (url === '/reports/stats') return Promise.resolve(mockStats);
            if (url.startsWith('/reports?')) return Promise.resolve({ data: { data: [], meta: { currentPage: 1, lastPage: 1, perPage: 20, total: 0 } } });
            return Promise.reject(new Error('Unexpected URL'));
        });
        renderReportQueue();
        await waitFor(() => {
            expect(screen.getByText('No reports pending review.')).toBeInTheDocument();
        });
    });

    it('shows error state on fetch failure', async () => {
        mockGet.mockRejectedValue(new Error('Network error'));
        renderReportQueue();
        await waitFor(() => {
            expect(screen.getByText('Failed to load reports.')).toBeInTheDocument();
        });
    });
});
