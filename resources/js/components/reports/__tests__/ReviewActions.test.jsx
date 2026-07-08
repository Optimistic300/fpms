import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReviewActions from '../ReviewActions';

const baseReport = {
    id: 1,
    type: 'QUARTERLY',
    version: 1,
    daysWaiting: 3,
    priorApprovedCount: 2,
};

function renderActions(report = baseReport, onAction = vi.fn(), loading = false) {
    return render(<ReviewActions report={report} onAction={onAction} loading={loading} />);
}

describe('ReviewActions', () => {
    it('renders panel title', () => {
        renderActions();
        expect(screen.getByText('Review Action')).toBeInTheDocument();
    });

    it('renders metadata rows', () => {
        renderActions();
        expect(screen.getByText('QUARTERLY')).toBeInTheDocument();
        expect(screen.getByText('v1')).toBeInTheDocument();
        expect(screen.getByText('3 days')).toBeInTheDocument();
        expect(screen.getByText('2 report(s)')).toBeInTheDocument();
    });

    it('renders three action buttons', () => {
        renderActions();
        expect(screen.getByText('Approve')).toBeInTheDocument();
        expect(screen.getByText('Return for revision')).toBeInTheDocument();
        expect(screen.getByText('Escalate to management')).toBeInTheDocument();
    });

    it('disables buttons when loading', () => {
        renderActions(baseReport, vi.fn(), true);
        const processing = screen.getAllByText('Processing...');
        expect(processing.length).toBe(3);
        processing.forEach((btn) => expect(btn).toBeDisabled());
    });

    it('shows resubmission badge when version > 1', () => {
        renderActions({ ...baseReport, version: 2 });
        expect(screen.getByText(/resubmission/)).toBeInTheDocument();
        expect(screen.getByText('v2')).toBeInTheDocument();
    });

    it('calls onAction with APPROVED on approve click (no comment)', async () => {
        const onAction = vi.fn();
        const user = userEvent.setup();
        renderActions(baseReport, onAction);
        await user.click(screen.getByText('Approve'));
        expect(onAction).toHaveBeenCalledWith('APPROVED', '');
    });

    it('shows validation error when returning without comment', async () => {
        const onAction = vi.fn();
        const user = userEvent.setup();
        renderActions(baseReport, onAction);
        await user.click(screen.getByText('Return for revision'));
        expect(screen.getByText('Comment is required for return and escalation.')).toBeInTheDocument();
        expect(onAction).not.toHaveBeenCalled();
    });

    it('shows validation error when escalating without comment', async () => {
        const onAction = vi.fn();
        const user = userEvent.setup();
        renderActions(baseReport, onAction);
        await user.click(screen.getByText('Escalate to management'));
        expect(screen.getByText('Comment is required for return and escalation.')).toBeInTheDocument();
        expect(onAction).not.toHaveBeenCalled();
    });

    it('calls onAction with RETURNED when comment is provided', async () => {
        const onAction = vi.fn();
        const user = userEvent.setup();
        renderActions(baseReport, onAction);
        const textarea = screen.getByPlaceholderText('Enter your review comments...');
        await user.type(textarea, 'Needs methodology section.');
        await user.click(screen.getByText('Return for revision'));
        expect(onAction).toHaveBeenCalledWith('RETURNED', 'Needs methodology section.');
    });
});