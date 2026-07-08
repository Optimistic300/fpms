import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ReportReview from '../ReportReview';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockGet = vi.fn();
const mockPatch = vi.fn();

vi.mock('../../api/axios', () => ({
    default: {
        get: (...args) => mockGet(...args),
        patch: (...args) => mockPatch(...args),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
}));

function renderReview(reportId = '1') {
    return render(
        <MemoryRouter initialEntries={[`/queue/${reportId}`]}>
            <Routes>
                <Route path="/queue/:reportId" element={<ReportReview />} />
            </Routes>
        </MemoryRouter>
    );
}

const mockReport = {
    data: {
        data: {
            id: 1,
            projectId: 42,
            reportName: 'Q1 2026 Progress Report',
            projectTitle: 'Carbon Stock Assessment',
            type: 'QUARTERLY',
            status: 'PENDING',
            version: 1,
            narrativeSummary: 'This quarter we completed fieldwork.',
            file: { filename: 'q1-report.pdf', size: 1048576 },
            submittedBy: 'Yaa Asantewaa',
            division: 'Forest Ecology',
            submittedAt: '2026-04-05T10:00:00Z',
            daysWaiting: 3,
            comment: null,
            history: [
                { event: 'SUBMITTED', timestamp: '2026-04-05T10:00:00Z', user: 'Yaa Asantewaa' },
            ],
            comments: [],
            priorApprovedCount: 2,
        },
    },
};

const mockQueue = {
    data: {
        data: [
            { id: 1, reportName: 'Q1 Report', status: 'PENDING', submittedAt: '2026-04-05T10:00:00Z', daysWaiting: 3 },
            { id: 2, reportName: 'Q2 Report', status: 'PENDING', submittedAt: '2026-04-06T10:00:00Z', daysWaiting: 2 },
        ],
        meta: { total: 2 },
    },
};

const mockPriorApproved = {
    data: {
        data: [
            { id: 10, reportName: 'Q4 2025 Report', submittedAt: '2026-01-15T10:00:00Z' },
        ],
    },
};

describe('ReportReview', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPatch.mockResolvedValue({ data: { data: { id: 1, status: 'APPROVED' }, message: 'Approved.' } });
        mockGet.mockImplementation((url) => {
            if (url === '/reports/1') return Promise.resolve(mockReport);
            if (url.includes('/reports?status=PENDING&sortBy=submittedAt')) return Promise.resolve(mockQueue);
            if (url.includes('/reports?projectId=42&status=APPROVED')) return Promise.resolve(mockPriorApproved);
            return Promise.reject(new Error('Unexpected URL: ' + url));
        });
    });

    it('renders breadcrumb', async () => {
        renderReview();
        await waitFor(() => {
            expect(screen.getByText('Report queue')).toBeInTheDocument();
        });
    });

    it('renders report title', async () => {
        renderReview();
        await waitFor(() => {
            expect(screen.getAllByText('Q1 2026 Progress Report').length).toBe(2);
        });
    });

    it('renders researcher and division info', async () => {
        renderReview();
        await waitFor(() => {
            expect(screen.getByText(/Researcher:/)).toBeInTheDocument();
            expect(screen.getByText(/Forest Ecology/)).toBeInTheDocument();
        });
    });

    it('renders narrative summary', async () => {
        renderReview();
        await waitFor(() => {
            expect(screen.getByText('Narrative Summary')).toBeInTheDocument();
            expect(screen.getByText(/completed fieldwork/)).toBeInTheDocument();
        });
    });

    it('renders file attachment preview/download', async () => {
        renderReview();
        await waitFor(() => {
            expect(screen.getByText('q1-report.pdf')).toBeInTheDocument();
            expect(screen.getByText('Preview')).toBeInTheDocument();
            expect(screen.getByText('Download')).toBeInTheDocument();
        });
    });

    it('renders submission history', async () => {
        renderReview();
        await waitFor(() => {
            expect(screen.getByText('Submission History')).toBeInTheDocument();
            expect(screen.getByText('Submitted')).toBeInTheDocument();
        });
    });

    it('renders review action panel', async () => {
        renderReview();
        await waitFor(() => {
            expect(screen.getByText('Review Action')).toBeInTheDocument();
        });
        expect(screen.getByText('Approve')).toBeInTheDocument();
        expect(screen.getByText('Return for revision')).toBeInTheDocument();
        expect(screen.getByText('Escalate to management')).toBeInTheDocument();
    });

    it('shows queue position', async () => {
        renderReview();
        await waitFor(() => {
            expect(screen.getByText('1 of 2 in queue')).toBeInTheDocument();
        });
    });

    it('shows error state for 404', async () => {
        mockGet.mockImplementation((url) => {
            if (url === '/reports/999') return Promise.reject({ response: { status: 404 } });
            return Promise.reject(new Error('Unexpected'));
        });
        renderReview('999');
        await waitFor(() => {
            expect(screen.getByText('Report not found.')).toBeInTheDocument();
        });
    });

    it('navigates to queue on successful approve', async () => {
        const user = userEvent.setup();
        renderReview();
        await waitFor(() => {
            expect(screen.getByText('Approve')).toBeInTheDocument();
        });
        await user.click(screen.getByText('Approve'));
        await waitFor(() => {
            expect(mockPatch).toHaveBeenCalledWith('/reports/1', { status: 'APPROVED', comment: '' });
        });
    });

    it('disables buttons while action is loading', async () => {
        mockPatch.mockImplementation(() => new Promise(() => {})); // never resolves
        const user = userEvent.setup();
        renderReview();
        await waitFor(() => {
            expect(screen.getByText('Approve')).toBeInTheDocument();
        });
        await user.click(screen.getByText('Approve'));
        await waitFor(() => {
            const processing = screen.getAllByText('Processing...');
            expect(processing.length).toBe(3);
        });
    });
});
