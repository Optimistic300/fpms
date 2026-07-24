import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StatCard from '../StatCard';

describe('StatCard', () => {
    it('renders label and value', () => {
        render(<StatCard label="My Projects" value={12} onClick={() => {}} />);
        expect(screen.getByText('My Projects')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('renders icon when provided', () => {
        render(<StatCard label="Test" value={5} icon="📁" onClick={() => {}} />);
        expect(screen.getByText('📁')).toBeInTheDocument();
    });

    it('shows dashed when value is null', () => {
        render(<StatCard label="Test" value={null} onClick={() => {}} />);
        expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('calls onClick when clicked', async () => {
        const user = userEvent.setup();
        const handleClick = vi.fn();
        render(<StatCard label="Clickable" value={3} onClick={handleClick} />);
        await user.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows active styling when isActive is true', () => {
        render(<StatCard label="Active" value={8} isActive={true} onClick={() => {}} />);
        const btn = screen.getByRole('button');
        expect(btn.style.backgroundColor).toBe('rgb(239, 246, 255)');
    });

    it('shows hint text when provided', () => {
        render(<StatCard label="Test" value={1} hint="Click to view" onClick={() => {}} />);
        expect(screen.getByText('Click to view')).toBeInTheDocument();
    });

    it('shows skeleton when loading', () => {
        const { container } = render(<StatCard loading={true} />);
        const skeletons = container.querySelectorAll('[style*="animation"]');
        expect(skeletons.length).toBeGreaterThan(0);
    });
});
