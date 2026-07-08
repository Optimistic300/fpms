import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CitationCard from '../CitationCard';

describe('CitationCard', () => {
    it('renders citation number and title', () => {
        const citation = { id: 1, title: 'Test Document', author: 'John Doe', division: 'FORIG', fileType: 'PDF', page: 42 };
        render(<CitationCard citation={citation} index={1} />);
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('Test Document')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('FORIG')).toBeInTheDocument();
        expect(screen.getByText('PDF')).toBeInTheDocument();
        expect(screen.getByText(/p\. 42/)).toBeInTheDocument();
    });

    it('calls onClick when clicked', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        const citation = { id: 1, title: 'Doc', author: 'Author' };
        render(<CitationCard citation={citation} index={1} onClick={onClick} />);
        await user.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('handles missing optional fields', () => {
        const citation = { id: 1, title: 'Doc' };
        render(<CitationCard citation={citation} index={1} />);
        expect(screen.getByText('Doc')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
    });
});
