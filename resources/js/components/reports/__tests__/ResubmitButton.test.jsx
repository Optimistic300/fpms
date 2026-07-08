import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ResubmitButton from '../ResubmitButton';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

function renderButton(props = {}) {
    return render(
        <MemoryRouter>
            <ResubmitButton reportId={1} projectId={42} {...props} />
        </MemoryRouter>
    );
}

describe('ResubmitButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders with default label', () => {
        renderButton();
        expect(screen.getByText('Resubmit')).toBeInTheDocument();
    });

    it('renders with custom label', () => {
        renderButton({ label: 'Re-submit Report' });
        expect(screen.getByText('Re-submit Report')).toBeInTheDocument();
    });

    it('navigates to resubmit URL on click', async () => {
        const user = userEvent.setup();
        renderButton({ reportId: 5, projectId: 10 });
        await user.click(screen.getByText('Resubmit'));
        expect(mockNavigate).toHaveBeenCalledWith('/reports/new?projectId=10&resubmit=5');
    });

    it('navigates without projectId when not provided', async () => {
        const user = userEvent.setup();
        renderButton({ reportId: 5, projectId: null });
        await user.click(screen.getByText('Resubmit'));
        expect(mockNavigate).toHaveBeenCalledWith('/reports/new?resubmit=5');
    });

    it('renders as a button element', () => {
        renderButton();
        expect(screen.getByRole('button')).toBeInTheDocument();
    });
});
