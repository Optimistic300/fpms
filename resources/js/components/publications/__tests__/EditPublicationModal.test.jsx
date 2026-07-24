import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditPublicationModal from '../EditPublicationModal';

const mockApiPost = vi.fn();

vi.mock('../../../api/axios', () => ({
    default: {
        post: (...args) => mockApiPost(...args),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
}));

const mockPublication = {
    id: 1,
    title: 'Carbon Sequestration Potential',
    authors: 'Yaa Asantewaa',
    type: 'PAPER',
    status: 'PUBLISHED',
    journalName: 'Forest Ecology',
    doi: '10.1016/j.foreco.2026.01.001',
    submittedById: 1,
};

const onClose = vi.fn();
const onUpdated = vi.fn();

function renderModal(overrides = {}) {
    return render(
        <EditPublicationModal
            isOpen={true}
            onClose={onClose}
            publication={mockPublication}
            onUpdated={onUpdated}
            {...overrides}
        />
    );
}

describe('EditPublicationModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not render when isOpen is false', () => {
        const { container } = render(
            <EditPublicationModal
                isOpen={false}
                onClose={onClose}
                publication={mockPublication}
                onUpdated={onUpdated}
            />
        );
        expect(container.innerHTML).toBe('');
    });

    it('renders modal title', () => {
        renderModal();
        expect(screen.getByText('Edit Publication')).toBeInTheDocument();
    });

    it('pre-fills form with publication data', () => {
        renderModal();
        expect(screen.getByDisplayValue('Carbon Sequestration Potential')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Yaa Asantewaa')).toBeInTheDocument();
    });

    it('validates required fields', async () => {
        const user = userEvent.setup();
        renderModal();
        const titleInput = screen.getByDisplayValue('Carbon Sequestration Potential');
        await user.clear(titleInput);
        await user.click(screen.getByText('Save Changes'));
        await waitFor(() => {
            expect(screen.getByText('Title and Authors are required.')).toBeInTheDocument();
        });
    });

    it('calls onClose when Cancel is clicked', async () => {
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
        const updatedPub = { ...mockPublication, title: 'Updated Title' };
        mockApiPost.mockResolvedValue({ data: { data: updatedPub } });
        renderModal();

        const titleInput = screen.getByDisplayValue('Carbon Sequestration Potential');
        await user.clear(titleInput);
        await user.type(titleInput, 'Updated Title');
        await user.click(screen.getByText('Save Changes'));

        await waitFor(() => {
            expect(mockApiPost).toHaveBeenCalled();
        });
        await waitFor(() => {
            expect(onUpdated).toHaveBeenCalledWith(updatedPub);
        });
        expect(onClose).toHaveBeenCalled();
    });

    it('shows submitting state', async () => {
        const user = userEvent.setup();
        mockApiPost.mockReturnValue(new Promise(() => {}));
        renderModal();
        await user.click(screen.getByText('Save Changes'));
        expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('displays server error on failure', async () => {
        const user = userEvent.setup();
        mockApiPost.mockRejectedValue({
            response: { data: { message: 'Server error' } },
        });
        renderModal();
        await user.click(screen.getByText('Save Changes'));
        await waitFor(() => {
            expect(screen.getByText('Server error')).toBeInTheDocument();
        });
    });
});
