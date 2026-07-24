import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditActivityModal from '../EditActivityModal';

const mockPut = vi.fn();

vi.mock('../../../api/axios', () => ({
    default: {
        put: (...args) => mockPut(...args),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
}));

const activity = { id: 1, description: 'Field visit', notes: 'Some notes' };

describe('EditActivityModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not render when isOpen is false', () => {
        const { container } = render(
            <EditActivityModal isOpen={false} onClose={vi.fn()} activity={activity} onUpdated={vi.fn()} />
        );
        expect(container.innerHTML).toBe('');
    });

    it('renders with pre-filled fields', () => {
        render(
            <EditActivityModal isOpen={true} onClose={vi.fn()} activity={activity} onUpdated={vi.fn()} />
        );
        expect(screen.getByDisplayValue('Field visit')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Some notes')).toBeInTheDocument();
        expect(screen.getByText('Edit Activity')).toBeInTheDocument();
    });

    it('calls onClose when Cancel is clicked', async () => {
        const onClose = vi.fn();
        const user = userEvent.setup();
        render(
            <EditActivityModal isOpen={true} onClose={onClose} activity={activity} onUpdated={vi.fn()} />
        );
        await user.click(screen.getByText('Cancel'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('submits the form and calls onUpdated', async () => {
        const onUpdated = vi.fn();
        const onClose = vi.fn();
        const user = userEvent.setup();
        mockPut.mockResolvedValueOnce({ data: { data: { id: 1, description: 'Updated', notes: 'New notes' } } });

        render(
            <EditActivityModal isOpen={true} onClose={onClose} activity={activity} onUpdated={onUpdated} />
        );

        fireEvent.change(screen.getByDisplayValue('Field visit'), {
            target: { value: 'Updated description' },
        });

        await user.click(screen.getByText('Save Changes'));

        await waitFor(() => {
            expect(mockPut).toHaveBeenCalledWith('/activities/1', {
                description: 'Updated description',
                notes: 'Some notes',
            });
        });
        expect(onUpdated).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });

    it('shows validation error for empty description', async () => {
        const user = userEvent.setup();
        render(
            <EditActivityModal isOpen={true} onClose={vi.fn()} activity={activity} onUpdated={vi.fn()} />
        );
        fireEvent.change(screen.getByDisplayValue('Field visit'), {
            target: { value: '' },
        });
        await user.click(screen.getByText('Save Changes'));
        expect(screen.getByText('Description is required.')).toBeInTheDocument();
    });
});
