import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddMemberModal from '../AddMemberModal';

const mockApiPost = vi.fn();

vi.mock('../../../api/axios', () => ({
    default: {
        post: (...args) => mockApiPost(...args),
        get: vi.fn(),
        put: vi.fn(),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
}));

const onClose = vi.fn();
const onAdded = vi.fn();

function renderModal(overrides = {}) {
    return render(
        <AddMemberModal
            isOpen={true}
            onClose={onClose}
            projectId={1}
            onAdded={onAdded}
            {...overrides}
        />
    );
}

describe('AddMemberModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not render when isOpen is false', () => {
        const { container } = render(
            <AddMemberModal
                isOpen={false}
                onClose={onClose}
                projectId={1}
                onAdded={onAdded}
            />
        );
        expect(container.innerHTML).toBe('');
    });

    it('renders modal title', () => {
        renderModal();
        expect(screen.getByText('Add Team Member')).toBeInTheDocument();
    });

    it('renders email input', () => {
        renderModal();
        expect(
            screen.getByPlaceholderText('researcher@example.com')
        ).toBeInTheDocument();
    });

    it('renders role select', () => {
        renderModal();
        expect(screen.getByText('Lead')).toBeInTheDocument();
        expect(screen.getByText('Collaborator')).toBeInTheDocument();
    });

    it('validates email is required', async () => {
        const user = userEvent.setup();
        renderModal();
        await user.click(screen.getByText('Add Member'));
        await waitFor(() => {
            expect(screen.getByText('Email is required.')).toBeInTheDocument();
        });
    });

    it('calls onClose when cancel is clicked', async () => {
        const user = userEvent.setup();
        renderModal();
        await user.click(screen.getByText('Cancel'));
        expect(onClose).toHaveBeenCalled();
    });

    it('submits form and calls onAdded', async () => {
        const user = userEvent.setup();
        const newMember = { id: 5, name: 'Test User', role: 'COLLABORATOR' };
        mockApiPost.mockResolvedValue({ data: { data: newMember } });
        renderModal();

        await user.type(
            screen.getByPlaceholderText('researcher@example.com'),
            'test@example.com'
        );
        await user.click(screen.getByText('Add Member'));

        await waitFor(() => {
            expect(mockApiPost).toHaveBeenCalledWith('/projects/1/members', {
                email: 'test@example.com',
                role: 'COLLABORATOR',
            });
        });

        await waitFor(() => {
            expect(onAdded).toHaveBeenCalledWith(newMember);
        });
    });

    it('shows submitting state', async () => {
        const user = userEvent.setup();
        mockApiPost.mockReturnValue(new Promise(() => {}));
        renderModal();
        await user.type(
            screen.getByPlaceholderText('researcher@example.com'),
            'test@example.com'
        );
        await user.click(screen.getByText('Add Member'));
        expect(screen.getByText('Adding...')).toBeInTheDocument();
    });

    it('displays server error on failure', async () => {
        const user = userEvent.setup();
        mockApiPost.mockRejectedValue({
            response: { data: { message: 'User not found.' } },
        });
        renderModal();
        await user.type(
            screen.getByPlaceholderText('researcher@example.com'),
            'test@example.com'
        );
        await user.click(screen.getByText('Add Member'));
        await waitFor(() => {
            expect(screen.getByText('User not found.')).toBeInTheDocument();
        });
    });

    it('resets form fields after successful submission', async () => {
        const user = userEvent.setup();
        mockApiPost.mockResolvedValue({ data: { data: { id: 5, name: 'New User', role: 'COLLABORATOR' } } });
        renderModal();

        await user.type(
            screen.getByPlaceholderText('researcher@example.com'),
            'newuser@example.com'
        );
        await user.click(screen.getByText('Add Member'));

        await waitFor(() => {
            expect(mockApiPost).toHaveBeenCalledWith('/projects/1/members', {
                email: 'newuser@example.com',
                role: 'COLLABORATOR',
            });
        });
    });
});
