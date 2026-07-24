import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../api/axios', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
}));

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({ user: { role: 'RESEARCHER', fullName: 'Test User' } }),
}));

import apiClient from '../../api/axios';
import Library from '../Library';

const mockStats = {
    data: {
        data: {
            totalDocuments: 312,
            topDivisions: [
                { division: 'Forest Ecology', count: 89 },
                { division: 'Climate Change', count: 67 },
                { division: 'Social Science', count: 45 },
            ],
            addedThisQuarter: 28,
        },
    },
};

const mockDocumentsPage1 = {
    data: {
        data: [
            {
                id: 1,
                title: 'Carbon Stock Assessment',
                type: 'REPORT',
                division: 'Forest Ecology',
                researchArea: 'Carbon sequestration',
                uploadedBy: 'Yaa Asantewaa',
                uploadedAt: '2026-03-15T10:00:00Z',
            },
            {
                id: 2,
                title: 'Agroforestry Study',
                type: 'PAPER',
                division: 'Climate Change',
                researchArea: 'Agroforestry',
                uploadedBy: 'Kofi Mensah',
                uploadedAt: '2026-04-01T10:00:00Z',
            },
        ],
        meta: { currentPage: 1, lastPage: 5, total: 10 },
    },
};

function renderLibrary() {
    return render(
        <MemoryRouter>
            <Library />
        </MemoryRouter>
    );
}

describe('Library', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Library calls: stats | BrowsePanel calls: filter options (1 doc fetch), debounced doc fetch
        apiClient.get
            .mockResolvedValueOnce(mockStats)
            .mockResolvedValueOnce(mockDocumentsPage1)
            .mockResolvedValueOnce(mockDocumentsPage1);
    });

    it('renders page title', async () => {
        renderLibrary();
        expect(screen.getByText('Library')).toBeInTheDocument();
    });

    it('renders stats cards with total documents', async () => {
        renderLibrary();
        await waitFor(() => {
            expect(screen.getByText('Total documents')).toBeInTheDocument();
        });
        expect(screen.getByText('Added this quarter')).toBeInTheDocument();
    });

    it('renders browse and search tabs', async () => {
        renderLibrary();
        expect(screen.getByText('Browse')).toBeInTheDocument();
        expect(screen.getByText('Search')).toBeInTheDocument();
    });

    it('shows browse panel with documents', async () => {
        renderLibrary();
        await waitFor(() => {
            expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
        });
        expect(screen.getByText('Agroforestry Study')).toBeInTheDocument();
    });

    it('switches to search panel', async () => {
        const user = userEvent.setup();
        renderLibrary();
        await user.click(screen.getByText('Search'));
        expect(screen.getByPlaceholderText('Search the library...')).toBeInTheDocument();
    });
});
