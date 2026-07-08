import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProjectDetail from '../ProjectDetail';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockApiGet = vi.fn();
const mockApiPut = vi.fn();
const mockApiPost = vi.fn();

vi.mock('../../api/axios', () => ({
    default: {
        get: (...args) => mockApiGet(...args),
        put: (...args) => mockApiPut(...args),
        post: (...args) => mockApiPost(...args),
        patch: vi.fn(),
        delete: vi.fn(),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
}));

const mockProjectData = {
    id: 1,
    title: 'Carbon Stock Assessment',
    status: 'ACTIVE',
    lead: 'Yaa Asantewaa',
    division: 'Forest Ecology',
    fundingType: 'DONOR',
    researchArea: 'Carbon sequestration',
    location: 'Kakum National Park',
    startDate: '2024-01-15',
    endDate: '2024-12-15',
    description: 'A study on carbon stock.',
    progress: 60,
    isOwner: true,
    hasAccess: true,
    isLocked: false,
    activityCount: 5,
    documentCount: 3,
    recentDocuments: [
        { id: 1, filename: 'report.pdf', downloadUrl: '/downloads/1' },
    ],
};

const emptyData = { data: { data: [] } };

function renderProjectDetail(route = '/projects/1') {
    return render(
        <MemoryRouter initialEntries={[route]}>
            <Routes>
                <Route path="/projects/:id" element={<ProjectDetail />} />
            </Routes>
        </MemoryRouter>
    );
}

describe('ProjectDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockApiGet.mockImplementation((url) => {
            if (url === `/projects/1` || url === '/projects/1') {
                return Promise.resolve({ data: { data: mockProjectData } });
            }
            return Promise.resolve(emptyData);
        });
    });

    it('renders breadcrumb with project title', async () => {
        renderProjectDetail();
        await waitFor(() => {
            expect(screen.getByText('Projects')).toBeInTheDocument();
        });
        await waitFor(() => {
            expect(screen.getAllByText('Carbon Stock Assessment').length).toBeGreaterThanOrEqual(1);
        });
    });

    it('renders status badge', async () => {
        renderProjectDetail();
        await waitFor(() => {
            expect(screen.getByText('ACTIVE')).toBeInTheDocument();
        });
    });

    it('renders lead and division', async () => {
        renderProjectDetail();
        await waitFor(() => {
            expect(screen.getByText(/Yaa Asantewaa/)).toBeInTheDocument();
            expect(screen.getByText(/Forest Ecology/)).toBeInTheDocument();
        });
    });

    it('renders funding source', async () => {
        renderProjectDetail();
        await waitFor(() => {
            expect(screen.getAllByText(/Donor/).length).toBeGreaterThanOrEqual(1);
        });
    });

    it('renders date range', async () => {
        renderProjectDetail();
        await waitFor(() => {
            expect(screen.getByText('2024-01-15')).toBeInTheDocument();
        });
        expect(screen.getByText('2024-12-15')).toBeInTheDocument();
    });

    it('renders progress bar', async () => {
        renderProjectDetail();
        await waitFor(() => {
            expect(screen.getByText('60%')).toBeInTheDocument();
        });
    });

    it('renders Edit button when user is owner', async () => {
        renderProjectDetail();
        await waitFor(() => {
            expect(screen.getByText('Edit')).toBeInTheDocument();
        });
    });

    it('renders Log Activity button when user is owner', async () => {
        renderProjectDetail();
        await waitFor(() => {
            expect(screen.getByText('Log Activity')).toBeInTheDocument();
        });
    });

    it('does not render Edit/Log Activity when user is not owner', async () => {
        mockApiGet.mockImplementation((url) => {
            if (url === `/projects/1` || url === '/projects/1') {
                return Promise.resolve({
                    data: { data: { ...mockProjectData, isOwner: false } },
                });
            }
            return Promise.resolve(emptyData);
        });
        renderProjectDetail();
        await waitFor(() => {
            expect(screen.getAllByText('Carbon Stock Assessment').length).toBeGreaterThanOrEqual(1);
        });
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
        expect(screen.queryByText('Log Activity')).not.toBeInTheDocument();
    });

    it('redirects to preview on 403', async () => {
        mockApiGet.mockImplementation((url) => {
            if (url === `/projects/1` || url === '/projects/1') {
                return Promise.reject({ response: { status: 403 } });
            }
            return Promise.resolve(emptyData);
        });
        renderProjectDetail();
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/projects/1/preview', {
                replace: true,
            });
        });
    });

    it('shows error on fetch failure', async () => {
        mockApiGet.mockImplementation((url) => {
            if (url === `/projects/1` || url === '/projects/1') {
                return Promise.reject({ response: { status: 500 } });
            }
            return Promise.resolve(emptyData);
        });
        renderProjectDetail();
        await waitFor(() => {
            expect(
                screen.getByText('Failed to load project.')
            ).toBeInTheDocument();
        });
    });

    it('renders four tabs', async () => {
        renderProjectDetail();
        await waitFor(() => {
            expect(screen.getByText('Activities')).toBeInTheDocument();
        });
        expect(screen.getByText('Documents')).toBeInTheDocument();
        expect(screen.getByText('Reports')).toBeInTheDocument();
        expect(screen.getByText('Team')).toBeInTheDocument();
    });

    it('Activities tab is active by default', async () => {
        renderProjectDetail();
        await waitFor(() => {
            const activitiesTab = screen.getByText('Activities');
            expect(activitiesTab).toBeInTheDocument();
        });
    });

    it('renders right sidebar with metadata', async () => {
        renderProjectDetail();
        await waitFor(() => {
            expect(screen.getByText('Project Details')).toBeInTheDocument();
        });
        expect(screen.getByText(/Carbon sequestration/)).toBeInTheDocument();
        expect(screen.getByText(/Kakum National Park/)).toBeInTheDocument();
    });

    it('renders recent documents in sidebar', async () => {
        renderProjectDetail();
        await waitFor(() => {
            expect(screen.getByText('Recent Documents')).toBeInTheDocument();
        });
        expect(screen.getByText('report.pdf')).toBeInTheDocument();
    });

    it('renders sidebar action buttons', async () => {
        renderProjectDetail();
        await waitFor(() => {
            expect(screen.getByText('Submit Report')).toBeInTheDocument();
        });
        await waitFor(() => {
            expect(screen.getByText('Share Access')).toBeInTheDocument();
        });
        await waitFor(() => {
            expect(screen.getByText('Publish to Library')).toBeInTheDocument();
        });
    });

    it('navigates to log activity on button click', async () => {
        const user = userEvent.setup();
        renderProjectDetail();
        await waitFor(() => {
            expect(screen.getByText('Log Activity')).toBeInTheDocument();
        });
        await user.click(screen.getByText('Log Activity'));
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/log-activity?projectId=1');
        });
    });

    it('opens edit modal on Edit button click', async () => {
        const user = userEvent.setup();
        renderProjectDetail();
        await waitFor(() => {
            expect(screen.getByText('Edit')).toBeInTheDocument();
        });
        await user.click(screen.getByText('Edit'));
        await waitFor(() => {
            expect(screen.getByText('Edit Project')).toBeInTheDocument();
        });
    });

    it('shows loading state initially', async () => {
        mockApiGet.mockReturnValue(new Promise(() => {}));
        renderProjectDetail();
        expect(screen.getByText('Loading project...')).toBeInTheDocument();
    });

    it('toggles tab on click', async () => {
        const user = userEvent.setup();
        renderProjectDetail();
        await waitFor(() => {
            expect(screen.getByText('Documents')).toBeInTheDocument();
        });
        await user.click(screen.getByText('Documents'));
        await waitFor(() => {
            expect(screen.getByText('No documents uploaded yet.')).toBeInTheDocument();
        });
    });
});
