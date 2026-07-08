import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyActivities from '../MyActivities';

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
const mockDelete = vi.fn();
const mockPatch = vi.fn();
const mockPost = vi.fn();

vi.mock('../../api/axios', () => ({
    default: {
        get: (...args) => mockGet(...args),
        delete: (...args) => mockDelete(...args),
        patch: (...args) => mockPatch(...args),
        post: (...args) => mockPost(...args),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
}));

function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/activities']}>
            <MyActivities />
        </MemoryRouter>
    );
}

describe('MyActivities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGet.mockImplementation((url, config) => {
            if (url === '/projects') {
                return Promise.resolve({ data: { data: [{ id: 1, title: 'Forest Carbon' }] } });
            }
            if (url === '/activity-types') {
                return Promise.resolve({ data: { data: [{ id: 1, name: 'Field Survey' }] } });
            }
            if (url === '/activities') {
                const params = config?.params || {};
                const page = params?.page || 1;
                if (page === 1) {
                    return Promise.resolve({
                        data: {
                            data: [
                                {
                                    id: 1,
                                    description: 'Field visit',
                                    date: '2026-07-07',
                                    project: { title: 'Forest Carbon' },
                                    type: { name: 'Field Survey' },
                                    documents: [
                                        { id: 1, filename: 'report.pdf', published: false },
                                    ],
                                    notes: 'Collected samples',
                                    file_count: 1,
                                },
                            ],
                            meta: { lastPage: 1, last_page: 1 },
                        },
                    });
                }
                return Promise.resolve({
                    data: { data: [], meta: { lastPage: 1, last_page: 1 } },
                });
            }
            return Promise.resolve({ data: { data: [] } });
        });
    });

    it('renders the page title and Log Activity button', async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.getByText('My Activities')).toBeInTheDocument();
        });
        expect(screen.getByText('+ Log Activity')).toBeInTheDocument();
    });

    it('renders the filter bar', async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Search by description...')).toBeInTheDocument();
        });
        expect(screen.getByText('Export CSV')).toBeInTheDocument();
        expect(screen.getAllByRole('combobox')).toHaveLength(2);
    });

    it('renders activity rows', async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.getByText('Field visit')).toBeInTheDocument();
        });
        expect(screen.getAllByText('Forest Carbon').length).toBeGreaterThanOrEqual(1);
    });

    it('shows empty state when no activities', async () => {
        mockGet.mockImplementation((url) => {
            if (url === '/projects') return Promise.resolve({ data: { data: [{ id: 1, title: 'Forest Carbon' }] } });
            if (url === '/activity-types') return Promise.resolve({ data: { data: [{ id: 1, name: 'Field Survey' }] } });
            if (url === '/activities') {
                return Promise.resolve({ data: { data: [], meta: { lastPage: 1, last_page: 1 } } });
            }
            return Promise.resolve({ data: { data: [] } });
        });
        render(
            <MemoryRouter initialEntries={['/activities']}>
                <MyActivities />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(screen.getByText('No activities logged yet.')).toBeInTheDocument();
        });
    });
});
