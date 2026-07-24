import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LogActivity from '../LogActivity';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useSearchParams: () => [new URLSearchParams(''), vi.fn()],
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

function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/log-activity']}>
            <LogActivity />
        </MemoryRouter>
    );
}

describe('LogActivity', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGet.mockImplementation((url) => {
            if (url === '/projects') {
                return Promise.resolve({ data: { data: [{ id: 1, title: 'Forest Carbon' }] } });
            }
            if (url === '/activity-types') {
                return Promise.resolve({ data: { data: [{ id: 1, name: 'Field Survey' }] } });
            }
            return Promise.resolve({ data: { data: [] } });
        });
    });

    it('renders the wizard with step indicator', async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.getByText('Log Activity')).toBeInTheDocument();
        });
        expect(screen.getByText('Details')).toBeInTheDocument();
        expect(screen.getByText('Attach Files')).toBeInTheDocument();
        expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('shows Step 1 with project selector, date, type, description, notes', async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.getByText('Project *')).toBeInTheDocument();
        });
        expect(screen.getByText('Date *')).toBeInTheDocument();
        expect(screen.getByText('Activity Type *')).toBeInTheDocument();
        expect(screen.getByText('Description *')).toBeInTheDocument();
        expect(screen.getByText('Notes')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('validates required fields before advancing to Step 2', async () => {
        const user = userEvent.setup();
        renderPage();
        await waitFor(() => {
            expect(screen.getByText('Next')).toBeInTheDocument();
        });
        await user.click(screen.getByText('Next'));
        expect(screen.getByText('Project is required.')).toBeInTheDocument();
        expect(screen.getByText('Activity type is required.')).toBeInTheDocument();
        expect(screen.getByText('Description is required.')).toBeInTheDocument();
    });

    it('advances to Step 2 when validation passes', async () => {
        const user = userEvent.setup();
        renderPage();
        await waitFor(() => {
            expect(screen.getByText('Forest Carbon')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText('Brief description of the activity'), {
            target: { value: 'Test activity' },
        });
        const selects = screen.getAllByRole('combobox');
        await user.selectOptions(selects[0], '1');
        await user.selectOptions(selects[1], '1');

        await user.click(screen.getByText('Next'));

        expect(screen.getByText('Skip & Continue')).toBeInTheDocument();
        expect(screen.getByText('Drag & drop files here, or click to browse')).toBeInTheDocument();
    });
});
