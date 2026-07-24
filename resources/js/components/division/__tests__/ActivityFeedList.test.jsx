import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ActivityFeedList from '../ActivityFeedList';

const sampleActivities = [
    { type: 'activity', message: 'Yaa Asantewaa logged field data collection', timestamp: '2026-07-01T09:00:00Z', link: '/projects/42' },
    { type: 'alert', severity: 'warning', message: 'S. Mensah Q2 report not yet submitted — due 30 Jun', timestamp: '2026-06-28T00:00:00Z', link: '/reports?researcher=2' },
];

function renderComponent(props = {}) {
    return render(
        <MemoryRouter>
            <ActivityFeedList
                activities={[]}
                loading={false}
                error={false}
                {...props}
            />
        </MemoryRouter>
    );
}

describe('ActivityFeedList', () => {
    it('renders title', () => {
        renderComponent({ activities: sampleActivities });
        expect(screen.getByText('Activity Feed')).toBeInTheDocument();
    });

    it('renders activity messages', () => {
        renderComponent({ activities: sampleActivities });
        expect(screen.getByText('Yaa Asantewaa logged field data collection')).toBeInTheDocument();
        expect(screen.getByText('S. Mensah Q2 report not yet submitted — due 30 Jun')).toBeInTheDocument();
    });

    it('renders activity and alert icons', () => {
        renderComponent({ activities: sampleActivities });
        expect(screen.getByText('📌')).toBeInTheDocument();
        expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('renders timestamp', () => {
        renderComponent({ activities: sampleActivities });
        expect(screen.getByText('6d ago')).toBeInTheDocument();
        expect(screen.getByText('Jun 28')).toBeInTheDocument();
    });

    it('renders View all link', () => {
        renderComponent({ activities: sampleActivities });
        expect(screen.getByText('View all →')).toBeInTheDocument();
    });

    it('shows skeleton when loading', () => {
        const { container } = renderComponent({ loading: true });
        const skeletons = container.querySelectorAll('[style*="background-color: rgb(226, 232, 240)"]');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('shows error message when error', () => {
        renderComponent({ error: true });
        expect(screen.getByText('Failed to load activity feed.')).toBeInTheDocument();
    });

    it('shows empty state when no activities', () => {
        renderComponent({ activities: [] });
        expect(screen.getByText('No recent activity.')).toBeInTheDocument();
    });

    it('renders View link for activities with link', () => {
        renderComponent({ activities: sampleActivities });
        const viewLinks = screen.getAllByText('View');
        expect(viewLinks.length).toBe(2);
    });
});
