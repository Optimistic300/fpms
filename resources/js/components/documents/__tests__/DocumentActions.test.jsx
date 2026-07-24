import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DocumentActions from '../DocumentActions';

const mockApiPatch = vi.fn();
const mockApiPost = vi.fn();

vi.mock('../../../api/axios', () => ({
    default: {
        patch: (...args) => mockApiPatch(...args),
        post: (...args) => mockApiPost(...args),
        get: vi.fn(),
        put: vi.fn(),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
}));

const mockDoc = {
    id: 1,
    filename: 'report.pdf',
    type: 'PDF',
    downloadUrl: '/downloads/1',
    published: false,
};

const onAction = vi.fn();

function renderActions(overrides = {}) {
    return render(
        <DocumentActions
            document={mockDoc}
            onAction={onAction}
            {...overrides}
        />
    );
}

describe('DocumentActions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders download button', () => {
        renderActions();
        expect(screen.getByLabelText('Download document')).toBeInTheDocument();
    });

    it('renders publish button', () => {
        renderActions();
        expect(screen.getByLabelText('Publish document')).toBeInTheDocument();
    });

    it('renders forward button', () => {
        renderActions();
        expect(screen.getByLabelText('Forward document')).toBeInTheDocument();
    });

    it('opens download URL on download click', async () => {
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => {});
        const user = userEvent.setup();
        renderActions();
        await user.click(screen.getByLabelText('Download document'));
        expect(openSpy).toHaveBeenCalledWith('/downloads/1', '_blank');
        openSpy.mockRestore();
    });

    it('shows publish confirmation on publish click', async () => {
        const user = userEvent.setup();
        renderActions();
        await user.click(screen.getByLabelText('Publish document'));
        expect(screen.getByText('Publish?')).toBeInTheDocument();
        expect(screen.getByText('Yes')).toBeInTheDocument();
        expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('publishes document on confirm', async () => {
        const user = userEvent.setup();
        mockApiPatch.mockResolvedValue({ data: { message: 'OK' } });
        renderActions();

        await user.click(screen.getByLabelText('Publish document'));
        await user.click(screen.getByText('Yes'));

        await waitFor(() => {
            expect(mockApiPatch).toHaveBeenCalledWith('/documents/1', {
                published: true,
            });
        });
    });

    it('cancels publish on No click', async () => {
        const user = userEvent.setup();
        renderActions();

        await user.click(screen.getByLabelText('Publish document'));
        await user.click(screen.getByText('No'));

        expect(screen.queryByText('Publish?')).not.toBeInTheDocument();
    });

    it('shows forward email input on forward click', async () => {
        const user = userEvent.setup();
        renderActions();
        await user.click(screen.getByLabelText('Forward document'));
        expect(
            screen.getByPlaceholderText('email@example.com')
        ).toBeInTheDocument();
    });

    it('sends forward request', async () => {
        const user = userEvent.setup();
        mockApiPost.mockResolvedValue({ data: { message: 'OK' } });
        renderActions();

        await user.click(screen.getByLabelText('Forward document'));
        await user.type(
            screen.getByPlaceholderText('email@example.com'),
            'test@example.com'
        );
        await user.click(screen.getByText('Send'));

        await waitFor(() => {
            expect(mockApiPost).toHaveBeenCalledWith('/inbox/forward', {
                documentId: 1,
                email: 'test@example.com',
            });
        });
    });

    it('cancels forward on close click', async () => {
        const user = userEvent.setup();
        renderActions();

        await user.click(screen.getByLabelText('Forward document'));
        await user.click(screen.getByText('✕'));

        expect(
            screen.queryByPlaceholderText('email@example.com')
        ).not.toBeInTheDocument();
    });
});
