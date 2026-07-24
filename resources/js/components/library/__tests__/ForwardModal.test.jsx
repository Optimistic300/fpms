import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../../api/axios', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
}));

import apiClient from '../../../api/axios';
import ForwardModal from '../ForwardModal';

const mockUsers = {
    data: {
        data: [
            { id: 1, fullName: 'Yaa Asantewaa', role: 'RESEARCHER', division: 'Forest Ecology' },
            { id: 2, fullName: 'Kofi Mensah', role: 'RESEARCHER', division: 'Climate Change' },
        ],
    },
};

describe('ForwardModal', () => {
    const onClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    function renderModal(documentId = 1) {
        return render(<ForwardModal documentId={documentId} onClose={onClose} />);
    }

    it('renders modal title', () => {
        renderModal();
        expect(screen.getByText('Forward Document')).toBeInTheDocument();
    });

    it('renders search input', () => {
        renderModal();
        expect(screen.getByPlaceholderText('Type to search users...')).toBeInTheDocument();
    });

    it('searches users when typing', async () => {
        const user = userEvent.setup();
        apiClient.get.mockResolvedValueOnce(mockUsers);
        renderModal();

        const input = screen.getByPlaceholderText('Type to search users...');
        await user.type(input, 'Ya');

        await waitFor(() => {
            expect(apiClient.get).toHaveBeenCalledWith('/users', { params: { search: 'Ya', limit: 10 } });
        });
    });

    it('shows user search results', async () => {
        const user = userEvent.setup();
        apiClient.get.mockResolvedValueOnce(mockUsers);
        renderModal();

        await user.type(screen.getByPlaceholderText('Type to search users...'), 'Ya');

        await waitFor(() => {
            expect(screen.getByText('Yaa Asantewaa')).toBeInTheDocument();
            expect(screen.getByText('Kofi Mensah')).toBeInTheDocument();
        });
    });

    it('adds recipient on click', async () => {
        const user = userEvent.setup();
        apiClient.get.mockResolvedValueOnce(mockUsers);
        renderModal();

        await user.type(screen.getByPlaceholderText('Type to search users...'), 'Ya');
        await waitFor(() => {
            expect(screen.getByText('Yaa Asantewaa')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Yaa Asantewaa'));

        expect(screen.getByText(/Recipients \(1\)/)).toBeInTheDocument();
    });

    it('submit button forwards document', async () => {
        const user = userEvent.setup();
        apiClient.get.mockResolvedValueOnce(mockUsers);
        apiClient.post.mockResolvedValueOnce({});
        renderModal();

        const input = screen.getByPlaceholderText('Type to search users...');
        await user.type(input, 'Ya');
        await waitFor(() => {
            expect(screen.getByText('Yaa Asantewaa')).toBeInTheDocument();
        });
        await user.click(screen.getByText('Yaa Asantewaa'));

        const forwardBtn = screen.getByText(/Forward to 1 recipient/);
        await user.click(forwardBtn);

        await waitFor(() => {
            expect(apiClient.post).toHaveBeenCalledWith('/inbox/forward', {
                documentId: 1,
                recipientIds: [1],
                message: undefined,
            });
        });
        expect(onClose).toHaveBeenCalledWith(true);
    });

    it('calls onClose with false on cancel', async () => {
        const user = userEvent.setup();
        renderModal();
        await user.click(screen.getByText('Cancel'));
        expect(onClose).toHaveBeenCalledWith(false);
    });
});
