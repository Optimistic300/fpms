import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectFilters from '../ProjectFilters';

describe('ProjectFilters', () => {
    const defaultProps = {
        search: '',
        onSearchChange: vi.fn(),
        division: '',
        onDivisionChange: vi.fn(),
        status: '',
        onStatusChange: vi.fn(),
        fundingType: '',
        onFundingTypeChange: vi.fn(),
        divisions: [
            { id: 1, name: 'Forest Ecology' },
            { id: 2, name: 'Climate Change' },
        ],
    };

    it('renders search input and all filter chips', () => {
        render(<ProjectFilters {...defaultProps} />);
        expect(screen.getByPlaceholderText('Search projects...')).toBeInTheDocument();
        expect(screen.getByText('Division')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Funding')).toBeInTheDocument();
    });

    it('debounces search input changes', async () => {
        const onSearchChange = vi.fn();
        render(<ProjectFilters {...defaultProps} onSearchChange={onSearchChange} />);

        const input = screen.getByPlaceholderText('Search projects...');
        fireEvent.change(input, { target: { value: 'carbon' } });

        await waitFor(
            () => {
                expect(onSearchChange).toHaveBeenCalledWith('carbon');
            },
            { timeout: 500 }
        );
    });

    it('renders division options', () => {
        render(<ProjectFilters {...defaultProps} />);
        const selects = screen.getAllByRole('combobox');
        const divisionSelect = selects[0];
        expect(divisionSelect).toContainHTML('Forest Ecology');
        expect(divisionSelect).toContainHTML('Climate Change');
    });

    it('calls onStatusChange when status is selected', async () => {
        const onStatusChange = vi.fn();
        const user = userEvent.setup();
        render(<ProjectFilters {...defaultProps} onStatusChange={onStatusChange} />);

        const selects = screen.getAllByRole('combobox');
        const statusSelect = selects[1];
        await user.selectOptions(statusSelect, 'ACTIVE');
        expect(onStatusChange).toHaveBeenCalledWith('ACTIVE');
    });

    it('shows Clear all button when filters are active', () => {
        render(<ProjectFilters {...defaultProps} search="test" />);
        expect(screen.getByText('Clear all')).toBeInTheDocument();
    });

    it('hides Clear all button when no filters are active', () => {
        render(<ProjectFilters {...defaultProps} />);
        expect(screen.queryByText('Clear all')).not.toBeInTheDocument();
    });

    it('calls all clear handlers when Clear all is clicked', async () => {
        const onSearchChange = vi.fn();
        const onDivisionChange = vi.fn();
        const onStatusChange = vi.fn();
        const onFundingTypeChange = vi.fn();
        const user = userEvent.setup();

        render(
            <ProjectFilters
                {...defaultProps}
                search="test"
                onSearchChange={onSearchChange}
                onDivisionChange={onDivisionChange}
                onStatusChange={onStatusChange}
                onFundingTypeChange={onFundingTypeChange}
            />
        );

        await user.click(screen.getByText('Clear all'));
        expect(onSearchChange).toHaveBeenCalledWith('');
        expect(onDivisionChange).toHaveBeenCalledWith('');
        expect(onStatusChange).toHaveBeenCalledWith('');
        expect(onFundingTypeChange).toHaveBeenCalledWith('');
    });
});
