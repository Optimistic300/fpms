import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SubmitReport from '../SubmitReport';

const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useSearchParams: () => [mockSearchParams, vi.fn()],
    };
});

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('../../api/axios', () => ({
    default: {
        get: (...args) => mockGet(...args),
        post: (...args) => mockPost(...args),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
}));

function renderSubmitReport(params = '') {
    mockSearchParams = new URLSearchParams(params.replace('?', ''));
    return render(
        <MemoryRouter initialEntries={[`/reports/new${params}`]}>
            <SubmitReport />
        </MemoryRouter>
    );
}

const mockProjects = {
    data: {
        data: [
            { id: 1, title: 'Carbon Stock Assessment', status: 'ACTIVE' },
            { id: 2, title: 'Agroforestry Study', status: 'ACTIVE' },
        ],
        meta: { total: 2 },
    },
};

const mockDraftReport = {
    data: {
        data: {
            id: 10,
            projectId: 1,
            projectTitle: 'Carbon Stock Assessment',
            type: 'QUARTERLY',
            periodStart: '2026-01-01',
            periodEnd: '2026-03-31',
            narrativeSummary: 'Draft narrative',
            status: 'DRAFT',
            version: 1,
        },
    },
};

const mockReturnedReport = {
    data: {
        data: {
            id: 5,
            projectId: 1,
            projectTitle: 'Carbon Stock Assessment',
            type: 'QUARTERLY',
            periodStart: '2026-01-01',
            periodEnd: '2026-03-31',
            narrativeSummary: 'Original narrative',
            status: 'RETURNED',
            version: 1,
        },
    },
};

describe('SubmitReport', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGet.mockImplementation((url) => {
            if (url === '/projects') return Promise.resolve(mockProjects);
            return Promise.reject(new Error('Unexpected URL'));
        });
    });

    it('renders the page title', async () => {
        renderSubmitReport();
        await waitFor(() => {
            expect(screen.getByText('Submit Report')).toBeInTheDocument();
        });
    });

    it('renders all 4 step indicators', async () => {
        renderSubmitReport();
        await waitFor(() => {
            expect(screen.getByText('Select Project')).toBeInTheDocument();
            expect(screen.getByText('Report Details')).toBeInTheDocument();
            expect(screen.getByText('Attach Report')).toBeInTheDocument();
            expect(screen.getByText('Confirm & Submit')).toBeInTheDocument();
        });
    });

    it('loads projects and shows them in select', async () => {
        renderSubmitReport();
        await waitFor(() => {
            expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
        });
    });

    it('shows validation error if no project selected on next', async () => {
        const user = userEvent.setup();
        renderSubmitReport();
        await waitFor(() => {
            expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Next'));
        expect(screen.getByText('Please select a project.')).toBeInTheDocument();
    });

    it('advances to step 2 after selecting project and clicking next', async () => {
        const user = userEvent.setup();
        renderSubmitReport();
        await waitFor(() => {
            expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
        });

        const select = screen.getByRole('combobox');
        await user.selectOptions(select, '1');

        await user.click(screen.getByText('Next'));
        expect(screen.getByText('Report Type')).toBeInTheDocument();
        expect(screen.getByText('Quarterly')).toBeInTheDocument();
        expect(screen.getByText('Mid-year')).toBeInTheDocument();
        expect(screen.getByText('Annual')).toBeInTheDocument();
    });

    it('shows validation on step 2 when fields are empty', async () => {
        const user = userEvent.setup();
        renderSubmitReport();
        await waitFor(() => {
            expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
        });

        const select = screen.getByRole('combobox');
        await user.selectOptions(select, '1');
        await user.click(screen.getByText('Next'));

        await user.click(screen.getByText('Next'));
        expect(screen.getByText('Please select a report type.')).toBeInTheDocument();
        expect(screen.getByText('Period start date is required.')).toBeInTheDocument();
        expect(screen.getByText('Narrative summary is required.')).toBeInTheDocument();
    });

    it('advances to step 3 after filling step 2', async () => {
        const user = userEvent.setup();
        renderSubmitReport();
        await waitFor(() => {
            expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
        });

        const select = screen.getByRole('combobox');
        await user.selectOptions(select, '1');
        await user.click(screen.getByText('Next'));

        await user.click(screen.getByText('Quarterly'));
        const startInput = screen.getByLabelText(/Period Start/);
        const endInput = screen.getByLabelText(/Period End/);
        await user.clear(startInput);
        await user.type(startInput, '2026-01-01');
        await user.clear(endInput);
        await user.type(endInput, '2026-03-31');

        const textarea = screen.getByPlaceholderText(/Describe the work/);
        await user.type(textarea, 'Completed field data collection and analysis.');

        await user.click(screen.getByText('Next'));
        expect(screen.getByText('Attach Report (PDF)')).toBeInTheDocument();
    });

    it('shows save as draft button on steps 1-3', async () => {
        renderSubmitReport();
        await waitFor(() => {
            expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
        });
        expect(screen.getByText('Save as Draft')).toBeInTheDocument();
    });

    it('saves draft and navigates to /reports', async () => {
        mockPost.mockResolvedValueOnce({
            data: { data: { id: 1, status: 'DRAFT' }, message: 'Draft saved.' },
        });

        const user = userEvent.setup();
        renderSubmitReport();
        await waitFor(() => {
            expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
        });

        const select = screen.getByRole('combobox');
        await user.selectOptions(select, '1');
        await user.click(screen.getByText('Save as Draft'));

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith('/reports/draft', expect.any(Object));
            expect(mockNavigate).toHaveBeenCalledWith('/reports');
        });
    });

    it('renders back button on steps 2-4', async () => {
        const user = userEvent.setup();
        renderSubmitReport();
        await waitFor(() => {
            expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
        });

        const select = screen.getByRole('combobox');
        await user.selectOptions(select, '1');
        await user.click(screen.getByText('Next'));

        expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('goes back to step 1 from step 2 preserving data', async () => {
        const user = userEvent.setup();
        renderSubmitReport();
        await waitFor(() => {
            expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
        });

        const select = screen.getByRole('combobox');
        await user.selectOptions(select, '2');
        await user.click(screen.getByText('Next'));

        await user.click(screen.getByText('Back'));

        expect(screen.getByRole('combobox')).toHaveValue('2');
    });

    it('shows draft resume from URL param', async () => {
        mockGet.mockImplementation((url) => {
            if (url === '/projects') return Promise.resolve(mockProjects);
            if (url === '/reports/10') return Promise.resolve(mockDraftReport);
            return Promise.reject(new Error('Unexpected URL'));
        });

        renderSubmitReport('?draft=10');

        await waitFor(() => {
            expect(screen.getByRole('combobox')).toHaveValue('1');
        });
    });

    it('shows resubmit title when resubmit param present', async () => {
        mockGet.mockImplementation((url) => {
            if (url === '/projects') return Promise.resolve(mockProjects);
            if (url === '/reports/5') return Promise.resolve(mockReturnedReport);
            return Promise.reject(new Error('Unexpected URL'));
        });

        renderSubmitReport('?resubmit=5');

        await waitFor(() => {
            expect(screen.getByText('Resubmit Report')).toBeInTheDocument();
        });
    });

    it('submits report on step 4 and navigates to /reports', async () => {
        mockPost.mockResolvedValueOnce({
            data: { data: { id: 1, status: 'PENDING' }, message: 'Report submitted.' },
        });

        const user = userEvent.setup();
        renderSubmitReport();
        await waitFor(() => {
            expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
        });

        const select = screen.getByRole('combobox');
        await user.selectOptions(select, '1');
        await user.click(screen.getByText('Next'));

        await user.click(screen.getByText('Quarterly'));
        const startInput = screen.getByLabelText(/Period Start/);
        const endInput = screen.getByLabelText(/Period End/);
        await user.clear(startInput);
        await user.type(startInput, '2026-01-01');
        await user.clear(endInput);
        await user.type(endInput, '2026-03-31');
        const textarea = screen.getByPlaceholderText(/Describe the work/);
        await user.type(textarea, 'Completed work.');
        await user.click(screen.getByText('Next'));

        await user.click(screen.getByText('Next'));

        expect(screen.getByText('Review Your Submission')).toBeInTheDocument();
        expect(screen.getByText('Submit to Scientific Secretary')).toBeInTheDocument();

        await user.click(screen.getByText('Submit to Scientific Secretary'));

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith('/reports', expect.objectContaining({
                projectId: 1,
                type: 'QUARTERLY',
                periodStart: '2026-01-01',
                periodEnd: '2026-03-31',
                narrativeSummary: 'Completed work.',
            }));
            expect(mockNavigate).toHaveBeenCalledWith('/reports');
        });
    });

    it('shows step 4 warning text', async () => {
        const user = userEvent.setup();
        renderSubmitReport();
        await waitFor(() => {
            expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
        });

        const select = screen.getByRole('combobox');
        await user.selectOptions(select, '1');
        await user.click(screen.getByText('Next'));
        await user.click(screen.getByText('Quarterly'));
        const startInput = screen.getByLabelText(/Period Start/);
        const endInput = screen.getByLabelText(/Period End/);
        await user.clear(startInput);
        await user.type(startInput, '2026-01-01');
        await user.clear(endInput);
        await user.type(endInput, '2026-03-31');
        const textarea = screen.getByPlaceholderText(/Describe the work/);
        await user.type(textarea, 'Narrative.');
        await user.click(screen.getByText('Next'));
        await user.click(screen.getByText('Next'));

        expect(
            screen.getByText(/Once submitted you cannot edit this report/)
        ).toBeInTheDocument();
    });

    it('pre-fills projectId from URL param', async () => {
        renderSubmitReport('?projectId=2');

        await waitFor(() => {
            const select = screen.getByRole('combobox');
            expect(select).toHaveValue('2');
        });
    });

    it('shows error state when projects fail to load', async () => {
        mockGet.mockRejectedValueOnce(new Error('Network error'));

        renderSubmitReport();
        await waitFor(() => {
            expect(screen.getByText('Failed to load data. Please try again.')).toBeInTheDocument();
        });
    });

    it('shows submitting state on step 4 button', async () => {
        mockPost.mockReturnValueOnce(new Promise(() => {}));

        const user = userEvent.setup();
        renderSubmitReport();
        await waitFor(() => {
            expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
        });

        const select = screen.getByRole('combobox');
        await user.selectOptions(select, '1');
        await user.click(screen.getByText('Next'));
        await user.click(screen.getByText('Quarterly'));
        const startInput = screen.getByLabelText(/Period Start/);
        const endInput = screen.getByLabelText(/Period End/);
        await user.clear(startInput);
        await user.type(startInput, '2026-01-01');
        await user.clear(endInput);
        await user.type(endInput, '2026-03-31');
        const textarea = screen.getByPlaceholderText(/Describe the work/);
        await user.type(textarea, 'Testing submitting state.');
        await user.click(screen.getByText('Next'));
        await user.click(screen.getByText('Next'));

        await user.click(screen.getByText('Submit to Scientific Secretary'));
        expect(screen.getByText('Submitting...')).toBeInTheDocument();
    });
});
