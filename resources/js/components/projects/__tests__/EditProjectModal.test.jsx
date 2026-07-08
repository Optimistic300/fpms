import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditProjectModal from '../EditProjectModal';

const mockApiPut = vi.fn();

vi.mock('../../../api/axios', () => ({
    default: {
        put: (...args) => mockApiPut(...args),
        get: vi.fn(),
        post: vi.fn(),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
}));

const mockProject = {
    id: 1,
    title: 'Carbon Stock Assessment',
    fundingType: 'DONOR',
    researchArea: 'Carbon sequestration',
    location: 'Kakum',
    startDate: '2024-01-15',
    endDate: '2024-12-15',
    description: 'A study.',
};

const onClose = vi.fn();
const onUpdated = vi.fn();

function renderModal(overrides = {}) {
    return render(
        <EditProjectModal
            isOpen={true}
            onClose={onClose}
            project={mockProject}
            onUpdated={onUpdated}
            {...overrides}
        />
    );
}

describe('EditProjectModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not render when isOpen is false', () => {
        const { container } = render(
            <EditProjectModal
                isOpen={false}
                onClose={onClose}
                project={mockProject}
                onUpdated={onUpdated}
            />
        );
        expect(container.innerHTML).toBe('');
    });

    it('renders modal title', () => {
        renderModal();
        expect(screen.getByText('Edit Project')).toBeInTheDocument();
    });

    it('pre-fills form with project data', () => {
        renderModal();
        expect(screen.getByDisplayValue('Carbon Stock Assessment')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Carbon sequestration')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Kakum')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2024-12-15')).toBeInTheDocument();
    });

    it('validates required fields', async () => {
        const user = userEvent.setup();
        renderModal();
        const titleInput = screen.getByDisplayValue('Carbon Stock Assessment');
        await user.clear(titleInput);
        await user.click(screen.getByText('Save Changes'));
        await waitFor(() => {
            expect(screen.getByText('Title is required.')).toBeInTheDocument();
        });
    });

    it('calls onClose when cancel is clicked', async () => {
        const user = userEvent.setup();
        renderModal();
        await user.click(screen.getByText('Cancel'));
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when close button is clicked', async () => {
        const user = userEvent.setup();
        renderModal();
        await user.click(screen.getByLabelText('Close'));
        expect(onClose).toHaveBeenCalled();
    });

    it('submits form and calls onUpdated', async () => {
        const user = userEvent.setup();
        mockApiPut.mockResolvedValue({ data: { data: { ...mockProject, title: 'Updated Title' } } });
        renderModal();

        const titleInput = screen.getByDisplayValue('Carbon Stock Assessment');
        await user.clear(titleInput);
        await user.type(titleInput, 'Updated Title');

        await user.click(screen.getByText('Save Changes'));

        await waitFor(() => {
            expect(mockApiPut).toHaveBeenCalledWith('/projects/1', expect.objectContaining({
                title: 'Updated Title',
            }));
        });

        await waitFor(() => {
            expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Updated Title',
            }));
        });
    });

    it('shows submitting state', async () => {
        const user = userEvent.setup();
        mockApiPut.mockReturnValue(new Promise(() => {}));
        renderModal();
        await user.click(screen.getByText('Save Changes'));
        expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('displays server error on failure', async () => {
        const user = userEvent.setup();
        mockApiPut.mockRejectedValue({
            response: { data: { message: 'Server error' } },
        });
        renderModal();
        await user.click(screen.getByText('Save Changes'));
        await waitFor(() => {
            expect(screen.getByText('Server error')).toBeInTheDocument();
        });
    });

    it('displays validation errors from server', async () => {
        const user = userEvent.setup();
        mockApiPut.mockRejectedValue({
            response: {
                status: 422,
                data: { errors: { title: ['Title is too short.'] } },
            },
        });
        renderModal();
        await user.click(screen.getByText('Save Changes'));
        await waitFor(() => {
            expect(screen.getByText('Title is too short.')).toBeInTheDocument();
        });
    });
});
