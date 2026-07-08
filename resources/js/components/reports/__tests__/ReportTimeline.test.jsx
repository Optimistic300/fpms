import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReportTimeline from '../ReportTimeline';

describe('ReportTimeline', () => {
    it('renders nothing when history is empty', () => {
        const { container } = render(<ReportTimeline history={[]} />);
        expect(container.innerHTML).toBe('');
    });

    it('renders nothing when history is null', () => {
        const { container } = render(<ReportTimeline />);
        expect(container.innerHTML).toBe('');
    });

    it('renders timeline heading', () => {
        const history = [
            { event: 'SUBMITTED', timestamp: '2026-04-05T10:00:00Z', user: 'Yaa Asantewaa' },
        ];
        render(<ReportTimeline history={history} />);
        expect(screen.getByText('Submission Timeline')).toBeInTheDocument();
    });

    it('renders a single submitted event', () => {
        const history = [
            { event: 'SUBMITTED', timestamp: '2026-04-05T10:00:00Z', user: 'Yaa Asantewaa' },
        ];
        render(<ReportTimeline history={history} />);
        expect(screen.getByText('Submitted')).toBeInTheDocument();
        expect(screen.getByText(/Yaa Asantewaa/)).toBeInTheDocument();
    });

    it('renders returned event with comment', () => {
        const history = [
            { event: 'SUBMITTED', timestamp: '2026-04-05T10:00:00Z', user: 'Yaa Asantewaa' },
            {
                event: 'RETURNED',
                timestamp: '2026-04-07T14:30:00Z',
                user: 'E. Secretary',
                comment: 'Please include raw data tables.',
            },
        ];
        render(<ReportTimeline history={history} />);
        expect(screen.getByText('Returned with comments')).toBeInTheDocument();
        expect(screen.getByText('Please include raw data tables.')).toBeInTheDocument();
    });

    it('renders all event types', () => {
        const history = [
            { event: 'SUBMITTED', timestamp: '2026-04-05T10:00:00Z', user: 'Yaa Asantewaa' },
            { event: 'RETURNED', timestamp: '2026-04-07T14:30:00Z', user: 'E. Secretary', comment: 'Fix data' },
            { event: 'RESUBMITTED', timestamp: '2026-04-10T09:00:00Z' },
            { event: 'APPROVED', timestamp: '2026-04-12T11:00:00Z', user: 'E. Secretary' },
        ];
        render(<ReportTimeline history={history} />);
        expect(screen.getByText('Submitted')).toBeInTheDocument();
        expect(screen.getByText('Returned with comments')).toBeInTheDocument();
        expect(screen.getByText('Resubmitted')).toBeInTheDocument();
        expect(screen.getByText('Approved')).toBeInTheDocument();
    });

    it('sorts events chronologically', () => {
        const history = [
            { event: 'APPROVED', timestamp: '2026-04-12T11:00:00Z', user: 'E. Secretary' },
            { event: 'SUBMITTED', timestamp: '2026-04-05T10:00:00Z', user: 'Yaa Asantewaa' },
        ];
        render(<ReportTimeline history={history} />);
        const labels = screen.getAllByText(/Submitted|Approved/);
        expect(labels[0]).toHaveTextContent('Submitted');
        expect(labels[1]).toHaveTextContent('Approved');
    });

    it('renders escalated event', () => {
        const history = [
            { event: 'SUBMITTED', timestamp: '2026-04-05T10:00:00Z', user: 'Yaa Asantewaa' },
            { event: 'ESCALATED', timestamp: '2026-04-07T14:30:00Z', user: 'Manager', comment: 'Escalated to director' },
        ];
        render(<ReportTimeline history={history} />);
        expect(screen.getByText('Escalated')).toBeInTheDocument();
        expect(screen.getByText('Escalated to director')).toBeInTheDocument();
    });
});
