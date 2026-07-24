import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Publications from '../Publications';

const mockUseAuth = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
}));

const mockApiGet = vi.fn();
const mockApiDelete = vi.fn();

vi.mock('../../api/axios', () => ({
    default: {
        get: (...args) => mockApiGet(...args),
        delete: (...args) => mockApiDelete(...args),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
}));

function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/publications']}>
            <Publications />
        </MemoryRouter>
    );
}

const mockPublications = [
    {
        id: 1,
        title: 'Carbon Sequestration Potential',
        authors: 'Yaa Asantewaa',
        type: 'PAPER',
        status: 'PUBLISHED',
        journalName: 'Forest Ecology',
        doi: '10.1016/j.foreco.2026.01.001',
        submittedAt: '2026-01-15T10:00:00Z',
        submittedById: 1,
        linkedProject: { id: 42, title: 'Carbon Stock' },
    },
    {
        id: 2,
        title: 'Agroforestry Study',
        authors: 'Kofi Mensah',
        type: 'THESIS',
        status: 'SUBMITTED',
        journalName: null,
        submittedAt: '2026-06-01T10:00:00Z',
        submittedById: 2,
    },
    {
        id: 3,
        title: 'Draft Paper',
        authors: 'Test Author',
        type: 'PAPER',
        status: 'DRAFT',
        submittedById: 1,
    },
    {
        id: 4,
        title: 'Student Thesis',
        authors: 'Student Author',
        type: 'STUDENT',
        status: 'PUBLISHED',
        studentName: 'Kwame',
        supervisor: 'Dr. Mensah',
        degreeProgramme: 'MSc',
        submittedAt: '2025-12-01T10:00:00Z',
        submittedById: 3,
    },
    {
        id: 5,
        title: 'In Revision Paper',
        authors: 'Rev Author',
        type: 'PAPER',
        status: 'IN_REVISION',
        revisionDueDate: '2026-08-01',
        submittedById: 1,
    },
];

const mockPipeline = {
    data: {
        data: { draft: 1, submitted: 1, inRevision: 1, published: 2 },
    },
};

describe('Publications', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuth.mockReturnValue({
            user: {
                userId: 1,
                fullName: 'Yaa Asantewaa',
                role: 'RESEARCHER',
            },
            isAuthenticated: true,
            loading: false,
        });
        mockApiGet
            .mockResolvedValueOnce({ data: { data: mockPublications } })
            .mockResolvedValueOnce(mockPipeline);
    });

    it('renders page title', async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.getByText('Publications')).toBeInTheDocument();
        });
    });

    it('renders stat cards', async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.getByText('Total tracked')).toBeInTheDocument();
        });
        expect(screen.getByText('Published this year')).toBeInTheDocument();
    });

    it('renders pipeline strip with counts', async () => {
        renderPage();
        await waitFor(() => {
            const draftElements = screen.getAllByText('Draft');
            expect(draftElements.length).toBeGreaterThanOrEqual(1);
        });
    });

    it('renders all five tabs', async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Mine' })).toBeInTheDocument();
        });
        expect(screen.getByRole('button', { name: 'Published' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'In progress' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'CCST student work' })).toBeInTheDocument();
    });

    it('shows Add Publication button for researchers', async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.getByText('+ Add Publication')).toBeInTheDocument();
        });
    });

    it('hides Add Publication button for SECRETARY', async () => {
        mockUseAuth.mockReturnValue({
            user: { userId: 2, role: 'SECRETARY' },
        });
        mockApiGet
            .mockResolvedValueOnce({ data: { data: mockPublications } })
            .mockResolvedValueOnce(mockPipeline);
        renderPage();
        await waitFor(() => {
            expect(screen.queryByText('+ Add Publication')).not.toBeInTheDocument();
        });
    });

    it('hides Add Publication button for ADMIN', async () => {
        mockUseAuth.mockReturnValue({
            user: { userId: 2, role: 'ADMIN' },
        });
        mockApiGet
            .mockResolvedValueOnce({ data: { data: mockPublications } })
            .mockResolvedValueOnce(mockPipeline);
        renderPage();
        await waitFor(() => {
            expect(screen.queryByText('+ Add Publication')).not.toBeInTheDocument();
        });
    });

    it('filters publications by Mine tab', async () => {
        const user = userEvent.setup();
        renderPage();
        await waitFor(() => {
            expect(screen.getByText('Carbon Sequestration Potential')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Mine' }));

        await waitFor(() => {
            expect(screen.getByText('Carbon Sequestration Potential')).toBeInTheDocument();
            expect(screen.getByText('Draft Paper')).toBeInTheDocument();
            expect(screen.getByText('In Revision Paper')).toBeInTheDocument();
        });
        expect(screen.queryByText('Agroforestry Study')).not.toBeInTheDocument();
    });

    it('filters by Published tab', async () => {
        const user = userEvent.setup();
        renderPage();
        await waitFor(() => {
            expect(screen.getByText('Carbon Sequestration Potential')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Published' }));

        await waitFor(() => {
            expect(screen.getByText('Carbon Sequestration Potential')).toBeInTheDocument();
            expect(screen.getByText('Student Thesis')).toBeInTheDocument();
        });
        expect(screen.queryByText('Draft Paper')).not.toBeInTheDocument();
        expect(screen.queryByText('Agroforestry Study')).not.toBeInTheDocument();
    });

    it('filters by In progress tab', async () => {
        const user = userEvent.setup();
        renderPage();
        await waitFor(() => {
            expect(screen.getByText('Carbon Sequestration Potential')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'In progress' }));

        await waitFor(() => {
            expect(screen.getByText('Agroforestry Study')).toBeInTheDocument();
            expect(screen.getByText('In Revision Paper')).toBeInTheDocument();
        });
        expect(screen.queryByText('Draft Paper')).not.toBeInTheDocument();
        expect(screen.queryByText('Student Thesis')).not.toBeInTheDocument();
    });

    it('filters by CCST student work tab', async () => {
        const user = userEvent.setup();
        renderPage();
        await waitFor(() => {
            expect(screen.getByText('Carbon Sequestration Potential')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'CCST student work' }));

        await waitFor(() => {
            expect(screen.getByText('Student Thesis')).toBeInTheDocument();
        });
        expect(screen.queryByText('Carbon Sequestration Potential')).not.toBeInTheDocument();
    });

    it('shows empty state when no publications match', async () => {
        mockApiGet
            .mockReset()
            .mockResolvedValueOnce({ data: { data: [] } })
            .mockResolvedValueOnce(mockPipeline);
        renderPage();
        await waitFor(() => {
            expect(screen.getByText('No publications found.')).toBeInTheDocument();
        });
    });

    it('shows error state on fetch failure', async () => {
        mockApiGet
            .mockReset()
            .mockRejectedValueOnce(new Error('Network error'))
            .mockRejectedValueOnce(new Error('Network error'));
        renderPage();
        await waitFor(() => {
            expect(screen.getByText('Failed to load publications.')).toBeInTheDocument();
        });
    });

    it('shows delete confirmation and handles delete', async () => {
        const user = userEvent.setup();
        mockApiDelete.mockResolvedValue({});
        renderPage();
        await waitFor(() => {
            expect(screen.getByText('Carbon Sequestration Potential')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByText('Delete');
        await user.click(deleteButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Are you sure you want to delete this publication?')).toBeInTheDocument();
        });

        const confirmButtons = screen.getAllByText('Delete');
        const confirmDelete = confirmButtons.find((btn) => btn.closest('[style*="position: fixed"]'));
        await user.click(confirmDelete);

        await waitFor(() => {
            expect(mockApiDelete).toHaveBeenCalledWith('/publications/1');
        });
    });

    it('opens add publication modal', async () => {
        const user = userEvent.setup();
        renderPage();
        await waitFor(() => {
            expect(screen.getByText('+ Add Publication')).toBeInTheDocument();
        });

        await user.click(screen.getByText('+ Add Publication'));

        await waitFor(() => {
            expect(screen.getByText('Add Publication')).toBeInTheDocument();
        });
    });
});
