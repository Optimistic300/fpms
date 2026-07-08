import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddPublicationModal from '../AddPublicationModal';

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

const onClose = vi.fn();
const onCreated = vi.fn();

function renderModal(overrides = {}) {
    return render(
        <AddPublicationModal
            isOpen={true}
            onClose={onClose}
            onCreated={onCreated}
            {...overrides}
        />
    );
}

describe('AddPublicationModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not render when isOpen is false', () => {
        const { container } = render(
            <AddPublicationModal isOpen={false} onClose={onClose} onCreated={onCreated} />
        );
        expect(container.innerHTML).toBe('');
    });

    it('renders modal title', () => {
        renderModal();
        expect(screen.getByText('Add Publication')).toBeInTheDocument();
    });

    it('renders form fields', () => {
        renderModal();
        expect(screen.getByPlaceholderText('Full paper title')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Comma-separated names')).toBeInTheDocument();
        expect(screen.getByLabelText('Type')).toBeInTheDocument();
        expect(screen.getByLabelText('Status')).toBeInTheDocument();
    });

    it('shows DOI field when status is Published', async () => {
        const user = userEvent.setup();
        renderModal();
        const statusSelect = screen.getByLabelText('Status');
        await user.selectOptions(statusSelect, 'PUBLISHED');
        await waitFor(() => {
            expect(screen.getByPlaceholderText('10.xxxx/xxxxx')).toBeInTheDocument();
        });
    });

    it('shows student fields when type is STUDENT', async () => {
        const user = userEvent.setup();
        renderModal();
        const typeSelect = screen.getByLabelText('Type');
        await user.selectOptions(typeSelect, 'STUDENT');
        await waitFor(() => {
            expect(screen.getByText('Student Name')).toBeInTheDocument();
            expect(screen.getByText('Supervisor')).toBeInTheDocument();
            expect(screen.getByText('Degree Programme')).toBeInTheDocument();
        });
    });

    it('validates required fields', async () => {
        const user = userEvent.setup();
        renderModal();
        await user.click(screen.getByText('Create Publication'));
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

    it('submits the form and calls onCreated', async () => {
        const user = userEvent.setup();
        const newPub = { id: 1, title: 'New Paper', authors: 'Author 1' };
        mockApiPost.mockResolvedValue({ data: { data: newPub } });
        renderModal();

        await user.type(screen.getByPlaceholderText('Full paper title'), 'New Paper');
        await user.type(screen.getByPlaceholderText('Comma-separated names'), 'Author 1');
        await user.click(screen.getByText('Create Publication'));

        await waitFor(() => {
            expect(mockApiPost).toHaveBeenCalled();
        });
        await waitFor(() => {
            expect(onCreated).toHaveBeenCalledWith(newPub);
        });
        expect(onClose).toHaveBeenCalled();
    });

    it('shows submitting state', async () => {
        const user = userEvent.setup();
        mockApiPost.mockReturnValue(new Promise(() => {}));
        renderModal();

        await user.type(screen.getByPlaceholderText('Full paper title'), 'New Paper');
        await user.type(screen.getByPlaceholderText('Comma-separated names'), 'Author 1');
        await user.click(screen.getByText('Create Publication'));

        expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('displays server error on failure', async () => {
        const user = userEvent.setup();
        mockApiPost.mockRejectedValue({
            response: { data: { message: 'Server error' } },
        });
        renderModal();

        await user.type(screen.getByPlaceholderText('Full paper title'), 'New Paper');
        await user.type(screen.getByPlaceholderText('Comma-separated names'), 'Author 1');
        await user.click(screen.getByText('Create Publication'));

        await waitFor(() => {
            expect(screen.getByText('Server error')).toBeInTheDocument();
        });
    });
});
