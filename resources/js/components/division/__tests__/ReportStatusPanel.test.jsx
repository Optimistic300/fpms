import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReportStatusPanel from '../ReportStatusPanel';

const sampleReports = [
    { id: 1, reportName: 'Q1 2026 Progress Report', submittedBy: 'Yaa Asantewaa', submittedAt: '2026-04-05T10:00:00Z', status: 'PENDING' },
    { id: 2, reportName: 'Q2 Mid-year Report', submittedBy: 'Kofi Mensah', submittedAt: '2026-07-01T14:30:00Z', status: 'APPROVED' },
    { id: 3, reportName: 'Annual Summary', submittedBy: 'Ama Serwaa', submittedAt: null, status: 'RETURNED' },
];

function renderComponent(props = {}) {
    return render(
        <MemoryRouter>
            <ReportStatusPanel
                reports={[]}
                loading={false}
                error={false}
                divisionId={1}
                {...props}
            />
        </MemoryRouter>
    );
}

describe('ReportStatusPanel', () => {
    it('renders title', () => {
        renderComponent({ reports: sampleReports });
        expect(screen.getByText('Division Report Status')).toBeInTheDocument();
    });

    it('renders report names', () => {
        renderComponent({ reports: sampleReports });
        expect(screen.getByText('Q1 2026 Progress Report')).toBeInTheDocument();
        expect(screen.getByText('Q2 Mid-year Report')).toBeInTheDocument();
        expect(screen.getByText('Annual Summary')).toBeInTheDocument();
    });

    it('renders researcher names', () => {
        renderComponent({ reports: sampleReports });
        expect(screen.getByText('Yaa Asantewaa')).toBeInTheDocument();
        expect(screen.getByText('Kofi Mensah')).toBeInTheDocument();
        expect(screen.getByText('Ama Serwaa')).toBeInTheDocument();
    });

    it('renders submitted dates', () => {
        renderComponent({ reports: sampleReports });
        expect(screen.getByText('Apr 5, 2026')).toBeInTheDocument();
        expect(screen.getByText('Jul 1, 2026')).toBeInTheDocument();
        expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('renders status badges', () => {
        renderComponent({ reports: sampleReports });
        expect(screen.getByText('PENDING')).toBeInTheDocument();
        expect(screen.getByText('APPROVED')).toBeInTheDocument();
        expect(screen.getByText('RETURNED')).toBeInTheDocument();
    });

    it('renders All reports link', () => {
        renderComponent({ reports: sampleReports });
        expect(screen.getByText('All reports →')).toBeInTheDocument();
    });

    it('shows skeleton when loading', () => {
        const { container } = renderComponent({ loading: true });
        const skeletons = container.querySelectorAll('[style*="background-color: rgb(226, 232, 240)"]');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('shows error message when error', () => {
        renderComponent({ error: true });
        expect(screen.getByText('Failed to load reports.')).toBeInTheDocument();
    });

    it('shows empty state when no reports', () => {
        renderComponent({ reports: [] });
        expect(screen.getByText('No reports yet.')).toBeInTheDocument();
    });
});
