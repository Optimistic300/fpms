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
import SearchPanel from '../SearchPanel';

const mockSearchResults = {
    data: {
        data: [
            {
                id: 1,
                title: 'Carbon Stock Assessment',
                type: 'REPORT',
                snippet: 'carbon stock in <mark>Kakum</mark> National Park',
                division: 'Forest Ecology',
                author: 'Yaa Asantewaa',
                date: '2026-03-15',
                documentType: 'REPORT',
            },
        ],
        meta: { total: 1 },
    },
};

describe('SearchPanel', () => {
    const onPreview = vi.fn();
    const onDownload = vi.fn();
    const onForward = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    function renderSearch() {
        return render(
            <SearchPanel
                onPreview={onPreview}
                onDownload={onDownload}
                onForward={onForward}
            />
        );
    }

    it('renders search input and button', () => {
        renderSearch();
        expect(screen.getByPlaceholderText('Search the library...')).toBeInTheDocument();
        expect(screen.getByText('Search')).toBeInTheDocument();
    });

    it('search button is disabled when input is empty', () => {
        renderSearch();
        expect(screen.getByText('Search')).toBeDisabled();
    });

    it('performs search on submit', async () => {
        const user = userEvent.setup();
        apiClient.get.mockResolvedValueOnce(mockSearchResults);
        renderSearch();

        const input = screen.getByPlaceholderText('Search the library...');
        await user.type(input, 'Kakum');

        await user.click(screen.getByText('Search'));

        await waitFor(() => {
            expect(apiClient.get).toHaveBeenCalledWith('/library/search', { params: { q: 'Kakum' } });
        });
    });

    it('displays search results with highlighted snippet', async () => {
        const user = userEvent.setup();
        apiClient.get.mockResolvedValueOnce(mockSearchResults);
        renderSearch();

        const input = screen.getByPlaceholderText('Search the library...');
        await user.type(input, 'Kakum');
        await user.click(screen.getByText('Search'));

        await waitFor(() => {
            expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
            expect(screen.getByText('Forest Ecology')).toBeInTheDocument();
            expect(screen.getByText('Yaa Asantewaa')).toBeInTheDocument();
        });
    });

    it('shows warning banner when results are displayed', async () => {
        const user = userEvent.setup();
        apiClient.get.mockResolvedValueOnce(mockSearchResults);
        renderSearch();

        await user.type(screen.getByPlaceholderText('Search the library...'), 'Kakum');
        await user.click(screen.getByText('Search'));

        await waitFor(() => {
            expect(screen.getByText(/full-text search, not AI/)).toBeInTheDocument();
        });
    });

    it('shows no results state', async () => {
        const user = userEvent.setup();
        apiClient.get.mockResolvedValueOnce({ data: { data: [], meta: { total: 0 } } });
        renderSearch();

        await user.type(screen.getByPlaceholderText('Search the library...'), 'xyz');
        await user.click(screen.getByText('Search'));

        await waitFor(() => {
            expect(screen.getByText(/No documents found matching/)).toBeInTheDocument();
        });
    });

    it('clear button resets search and shows browse view', async () => {
        const user = userEvent.setup();
        apiClient.get.mockResolvedValueOnce(mockSearchResults);
        renderSearch();

        await user.type(screen.getByPlaceholderText('Search the library...'), 'Kakum');
        await user.click(screen.getByText('Search'));

        await waitFor(() => {
            expect(screen.getByText('Clear')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Clear'));
        expect(screen.queryByText('Carbon Stock Assessment')).not.toBeInTheDocument();
        expect(screen.queryByText('Clear')).not.toBeInTheDocument();
    });

    it('calls onPreview when Preview button clicked', async () => {
        const user = userEvent.setup();
        apiClient.get.mockResolvedValueOnce(mockSearchResults);
        renderSearch();

        await user.type(screen.getByPlaceholderText('Search the library...'), 'Kakum');
        await user.click(screen.getByText('Search'));

        await waitFor(() => {
            expect(screen.getByText('Preview')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Preview'));
        expect(onPreview).toHaveBeenCalledWith(mockSearchResults.data.data[0]);
    });

    it('calls onForward when Forward button clicked', async () => {
        const user = userEvent.setup();
        apiClient.get.mockResolvedValueOnce(mockSearchResults);
        renderSearch();

        await user.type(screen.getByPlaceholderText('Search the library...'), 'Kakum');
        await user.click(screen.getByText('Search'));

        await waitFor(() => {
            expect(screen.getAllByText('Forward').length).toBeGreaterThan(0);
        });

        await user.click(screen.getAllByText('Forward')[0]);
        expect(onForward).toHaveBeenCalledWith(1);
    });
});
