import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BottomTabBar from '../BottomTabBar';

const mockUseAuth = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
}));

function renderWithRouter() {
    return render(
        <MemoryRouter>
            <BottomTabBar />
        </MemoryRouter>
    );
}

describe('BottomTabBar', () => {
    it('renders basic tabs for RESEARCHER', () => {
        mockUseAuth.mockReturnValue({ user: { role: 'RESEARCHER' } });
        renderWithRouter();
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Projects')).toBeInTheDocument();
        expect(screen.getByText('Log')).toBeInTheDocument();
        expect(screen.getByText('Library')).toBeInTheDocument();
        expect(screen.getByText('Inbox')).toBeInTheDocument();
    });

    it('does not render Dashboard tab for SECRETARY', () => {
        mockUseAuth.mockReturnValue({ user: { role: 'SECRETARY' } });
        renderWithRouter();
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
        expect(screen.getByText('Projects')).toBeInTheDocument();
        expect(screen.getByText('Library')).toBeInTheDocument();
        expect(screen.getByText('Inbox')).toBeInTheDocument();
    });

    it('does not render Log tab for SECRETARY', () => {
        mockUseAuth.mockReturnValue({ user: { role: 'SECRETARY' } });
        renderWithRouter();
        expect(screen.queryByText('Log')).not.toBeInTheDocument();
    });
});
