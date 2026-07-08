import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProjectPreview from '../ProjectPreview';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => vi.fn(),
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

const mockProject = {
    data: {
        data: {
            id: 3,
            title: 'Biodiversity Survey',
            status: 'COMPLETED',
            lead: 'Ama Serwaa',
            division: 'Climate Change',
            researchArea: 'Biodiversity assessment',
            startDate: '2024-03-01',
            endDate: '2024-09-30',
            isOwner: false,
            hasAccess: false,
            isLocked: true,
        },
    },
};

function renderProjectPreview() {
    return render(
        <MemoryRouter initialEntries={['/projects/3/preview']}>
            <Routes>
                <Route path="/projects/:id/preview" element={<ProjectPreview />} />
            </Routes>
        </MemoryRouter>
    );
}

describe('ProjectPreview', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockApiGet.mockResolvedValue(mockProject);
    });

    it('renders limited metadata', async () => {
        renderProjectPreview();
        await waitFor(() => {
            expect(screen.getByText('Biodiversity Survey')).toBeInTheDocument();
        });
        expect(screen.getAllByText('COMPLETED').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Ama Serwaa')).toBeInTheDocument();
        expect(screen.getByText('Climate Change')).toBeInTheDocument();
        expect(screen.getByText('Biodiversity assessment')).toBeInTheDocument();
        expect(screen.getByText('2024-03-01')).toBeInTheDocument();
        expect(screen.getByText('2024-09-30')).toBeInTheDocument();
    });

    it('shows LIMITED ACCESS badge', async () => {
        renderProjectPreview();
        await waitFor(() => {
            expect(screen.getByText('LIMITED ACCESS')).toBeInTheDocument();
        });
    });

    it('renders Request Access button', async () => {
        renderProjectPreview();
        await waitFor(() => {
            expect(screen.getByText('Request Access')).toBeInTheDocument();
        });
    });

    it('shows description text about requesting access', async () => {
        renderProjectPreview();
        await waitFor(() => {
            expect(
                screen.getByText(
                    /You do not have access to this project/
                )
            ).toBeInTheDocument();
        });
    });

    it('sends access request on button click and shows success', async () => {
        const user = userEvent.setup();
        mockApiPost.mockResolvedValue({ data: { message: 'OK' } });
        renderProjectPreview();
        await waitFor(() => {
            expect(screen.getByText('Request Access')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Request Access'));

        await waitFor(() => {
            expect(mockApiPost).toHaveBeenCalledWith('/projects/3/access-requests');
        });

        await waitFor(() => {
            expect(screen.getByText('Access request sent.')).toBeInTheDocument();
        });
    });

    it('shows Access Requested after successful request', async () => {
        const user = userEvent.setup();
        mockApiPost.mockResolvedValue({ data: { message: 'OK' } });
        renderProjectPreview();
        await waitFor(() => {
            expect(screen.getByText('Request Access')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Request Access'));

        await waitFor(() => {
            expect(screen.getByText('Access Requested')).toBeInTheDocument();
        });
    });

    it('shows error toast on request failure', async () => {
        const user = userEvent.setup();
        mockApiPost.mockRejectedValue(new Error('Network error'));
        renderProjectPreview();
        await waitFor(() => {
            expect(screen.getByText('Request Access')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Request Access'));

        await waitFor(() => {
            expect(
                screen.getByText('Failed to send request. Please try again.')
            ).toBeInTheDocument();
        });
    });

    it('shows loading state', async () => {
        mockApiGet.mockReturnValue(new Promise(() => {}));
        renderProjectPreview();
        expect(screen.getByText('Loading project...')).toBeInTheDocument();
    });

    it('shows error state on fetch failure', async () => {
        mockApiGet.mockRejectedValue(new Error('Network error'));
        renderProjectPreview();
        await waitFor(() => {
            expect(
                screen.getByText('Failed to load project details.')
            ).toBeInTheDocument();
        });
    });
});
