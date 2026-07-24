import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportFilters from '../ReportFilters';

const defaultFilters = { search: '', pendingOnly: true, division: '', type: '', status: '' };

function renderFilters(filters = defaultFilters, onChange = vi.fn()) {
    return render(<ReportFilters filters={filters} onChange={onChange} />);
}

describe('ReportFilters', () => {
    it('renders search input', () => {
        renderFilters();
        expect(screen.getByPlaceholderText('Search by researcher, project, division...')).toBeInTheDocument();
    });

    it('renders pending only toggle', () => {
        renderFilters();
        expect(screen.getByText('✓ Pending only')).toBeInTheDocument();
    });

    it('shows all statuses when pendingOnly is false', () => {
        renderFilters({ ...defaultFilters, pendingOnly: false });
        const buttons = screen.getAllByText('All statuses');
        expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders division select', () => {
        renderFilters();
        expect(screen.getByText('All divisions')).toBeInTheDocument();
    });

    it('renders type select', () => {
        renderFilters();
        expect(screen.getByText('All types')).toBeInTheDocument();
    });

    it('calls onChange when pending only is toggled', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        renderFilters(defaultFilters, onChange);
        await user.click(screen.getByText('✓ Pending only'));
        expect(onChange).toHaveBeenCalledWith({ ...defaultFilters, pendingOnly: false });
    });

    it('shows clear filters button when filters are active', () => {
        renderFilters({ ...defaultFilters, search: 'test' });
        expect(screen.getByText('Clear filters')).toBeInTheDocument();
    });

    it('does not show clear filters button when no filters active', () => {
        renderFilters();
        expect(screen.queryByText('Clear filters')).not.toBeInTheDocument();
    });

    it('calls onChange with cleared filters on clear click', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        renderFilters({ search: 'test', pendingOnly: false, division: 'Forest Ecology', type: 'QUARTERLY', status: 'PENDING' }, onChange);
        await user.click(screen.getByText('Clear filters'));
        expect(onChange).toHaveBeenCalledWith({ search: '', pendingOnly: true, division: '', type: '', status: '' });
    });
});