import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import NewProjectModal from '../NewProjectModal';

function getStartDateInput(container) {
    return container.querySelector('input[type="date"]');
}

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockPost = vi.fn();

vi.mock('../../../api/axios', () => ({
    default: {
        post: (...args) => mockPost(...args),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
}));

const divisions = [
    { id: 1, name: 'Forest Ecology' },
    { id: 2, name: 'Climate Change' },
];

function renderModal(props = {}) {
    return render(
        <MemoryRouter>
            <NewProjectModal
                isOpen={true}
                onClose={vi.fn()}
                divisions={divisions}
                {...props}
            />
        </MemoryRouter>
    );
}

describe('NewProjectModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not render when isOpen is false', () => {
        const { container } = render(
            <MemoryRouter>
                <NewProjectModal isOpen={false} onClose={vi.fn()} divisions={divisions} />
            </MemoryRouter>
        );
        expect(container.innerHTML).toBe('');
    });

    it('renders form fields when open', () => {
        renderModal();
        expect(screen.getByText('New Project')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Project title')).toBeInTheDocument();
        expect(screen.getByText('Forest Ecology')).toBeInTheDocument();
        expect(screen.getByText('Climate Change')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g. Carbon sequestration')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g. Kakum National Park')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Brief description of the project')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Create Project')).toBeInTheDocument();
    });

    it('shows validation errors for required fields', async () => {
        const user = userEvent.setup();
        renderModal();

        await user.click(screen.getByText('Create Project'));

        expect(screen.getByText('Title is required.')).toBeInTheDocument();
        expect(screen.getByText('Division is required.')).toBeInTheDocument();
        expect(screen.getByText('Funding type is required.')).toBeInTheDocument();
        expect(screen.getByText('Start date is required.')).toBeInTheDocument();
    });

    it('calls onClose when Cancel is clicked', async () => {
        const onClose = vi.fn();
        const user = userEvent.setup();
        renderModal({ onClose });

        await user.click(screen.getByText('Cancel'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('submits form and navigates on success', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        mockPost.mockResolvedValueOnce({
            data: { data: { id: 42, title: 'Test' }, message: 'Created' },
        });

        const { container } = renderModal({ onClose });

        fireEvent.change(screen.getByPlaceholderText('Project title'), {
            target: { value: 'Test Project' },
        });

        const selects = screen.getAllByRole('combobox');
        await user.selectOptions(selects[0], '1'); // division
        await user.selectOptions(selects[1], 'DONOR'); // funding type

        const startDateInput = getStartDateInput(container);
        fireEvent.change(startDateInput, {
            target: { value: '2026-01-01' },
        });

        await user.click(screen.getByText('Create Project'));

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith('/projects', {
                title: 'Test Project',
                divisionId: 1,
                fundingType: 'DONOR',
                researchArea: undefined,
                location: undefined,
                startDate: '2026-01-01',
                endDate: undefined,
                description: undefined,
            });
        });

        expect(onClose).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/projects/42');
    });

    it('shows server validation errors', async () => {
        mockPost.mockRejectedValueOnce({
            response: {
                status: 422,
                data: {
                    message: 'Validation failed',
                    errors: {
                        title: ['The title field is required.'],
                        divisionId: ['The division id field is required.'],
                    },
                },
            },
        });

        const user = userEvent.setup();
        const { container } = renderModal();

        // Fill and submit
        fireEvent.change(screen.getByPlaceholderText('Project title'), {
            target: { value: 'Test Project' },
        });
        const selects = screen.getAllByRole('combobox');
        await user.selectOptions(selects[0], '1');
        await user.selectOptions(selects[1], 'DONOR');

        const startDateInput = getStartDateInput(container);
        fireEvent.change(startDateInput, {
            target: { value: '2026-01-01' },
        });

        await user.click(screen.getByText('Create Project'));

        await waitFor(() => {
            expect(screen.getByText('The title field is required.')).toBeInTheDocument();
            expect(screen.getByText('The division id field is required.')).toBeInTheDocument();
        });
    });

    it('shows generic server error', async () => {
        mockPost.mockRejectedValueOnce({
            response: {
                status: 500,
                data: { message: 'Server error. Please try again.' },
            },
        });

        const user = userEvent.setup();
        const { container } = renderModal();

        fireEvent.change(screen.getByPlaceholderText('Project title'), {
            target: { value: 'Test' },
        });
        const selects = screen.getAllByRole('combobox');
        await user.selectOptions(selects[0], '1');
        await user.selectOptions(selects[1], 'DONOR');

        const startDateInput = getStartDateInput(container);
        fireEvent.change(startDateInput, {
            target: { value: '2026-01-01' },
        });

        await user.click(screen.getByText('Create Project'));

        await waitFor(() => {
            expect(screen.getByText('Server error. Please try again.')).toBeInTheDocument();
        });
    });
});
