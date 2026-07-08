import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PublicationCard from '../PublicationCard';

const basePub = {
    id: 1,
    title: 'Carbon Sequestration Potential',
    authors: 'Yaa Asantewaa, Kofi Mensah',
    type: 'PAPER',
    status: 'PUBLISHED',
    journalName: 'Forest Ecology',
    doi: '10.1016/j.foreco.2026.01.001',
    submittedAt: '2026-01-15T10:00:00Z',
    submittedById: 1,
    linkedProject: { id: 42, title: 'Carbon Stock' },
};

const user = { userId: 1, role: 'RESEARCHER' };

describe('PublicationCard', () => {
    it('renders title and authors', () => {
        render(<PublicationCard publication={basePub} user={user} />);
        expect(screen.getByText('Carbon Sequestration Potential')).toBeInTheDocument();
        expect(screen.getByText('Yaa Asantewaa, Kofi Mensah')).toBeInTheDocument();
    });

    it('renders status badge', () => {
        render(<PublicationCard publication={basePub} user={user} />);
        expect(screen.getByText('Published')).toBeInTheDocument();
    });

    it('renders DOI link for published publications', () => {
        render(<PublicationCard publication={basePub} user={user} />);
        const doiLink = screen.getByText('DOI');
        expect(doiLink.tagName).toBe('A');
        expect(doiLink).toHaveAttribute('href', 'https://doi.org/10.1016/j.foreco.2026.01.001');
    });

    it('renders Journal name and date', () => {
        render(<PublicationCard publication={basePub} user={user} />);
        expect(screen.getByText('Forest Ecology')).toBeInTheDocument();
        expect(screen.getByText('Project: Carbon Stock')).toBeInTheDocument();
    });

    it('shows muted opacity for draft', () => {
        const draftPub = { ...basePub, status: 'DRAFT' };
        const { container } = render(<PublicationCard publication={draftPub} user={user} />);
        const card = container.firstChild;
        expect(card.style.opacity).toBe('0.6');
    });

    it('shows student fields when type is STUDENT', () => {
        const studentPub = {
            ...basePub,
            type: 'STUDENT',
            studentName: 'Kwame Nkrumah',
            supervisor: 'Dr. Mensah',
            degreeProgramme: 'MSc Forestry',
        };
        render(<PublicationCard publication={studentPub} user={user} />);
        expect(screen.getByText(/Kwame Nkrumah/)).toBeInTheDocument();
        expect(screen.getByText(/Dr. Mensah/)).toBeInTheDocument();
        expect(screen.getByText(/MSc Forestry/)).toBeInTheDocument();
    });

    it('shows revision deadline alert when within 60 days', () => {
        const future = new Date();
        future.setDate(future.getDate() + 30);
        const revPub = {
            ...basePub,
            status: 'IN_REVISION',
            revisionDueDate: future.toISOString().split('T')[0],
        };
        render(<PublicationCard publication={revPub} user={user} />);
        expect(screen.getByText(/Revision due in/)).toBeInTheDocument();
    });

    it('shows edit button for owner', () => {
        const onEdit = vi.fn();
        render(<PublicationCard publication={basePub} user={user} onEdit={onEdit} />);
        expect(screen.getByText('Edit Record')).toBeInTheDocument();
    });

    it('shows delete button for owner', () => {
        const onDelete = vi.fn();
        render(<PublicationCard publication={basePub} user={user} onDelete={onDelete} />);
        expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('calls onEdit when Edit Record is clicked', async () => {
        const userEv = userEvent.setup();
        const onEdit = vi.fn();
        render(<PublicationCard publication={basePub} user={user} onEdit={onEdit} />);
        await userEv.click(screen.getByText('Edit Record'));
        expect(onEdit).toHaveBeenCalledWith(basePub);
    });

    it('calls onDelete when Delete is clicked', async () => {
        const userEv = userEvent.setup();
        const onDelete = vi.fn();
        render(<PublicationCard publication={basePub} user={user} onDelete={onDelete} />);
        await userEv.click(screen.getByText('Delete'));
        expect(onDelete).toHaveBeenCalledWith(basePub);
    });

    it('hides action buttons for SECRETARY role', () => {
        const secUser = { userId: 2, role: 'SECRETARY' };
        render(<PublicationCard publication={basePub} user={secUser} />);
        expect(screen.queryByText('Edit Record')).not.toBeInTheDocument();
        expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('hides action buttons for ADMIN role', () => {
        const adminUser = { userId: 2, role: 'ADMIN' };
        render(<PublicationCard publication={basePub} user={adminUser} />);
        expect(screen.queryByText('Edit Record')).not.toBeInTheDocument();
        expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('shows Update Status for submitted publications', () => {
        const subPub = { ...basePub, status: 'SUBMITTED' };
        render(<PublicationCard publication={subPub} user={user} />);
        expect(screen.getByText('Update Status')).toBeInTheDocument();
    });

    it('shows View Manuscript for submitted with manuscript', () => {
        const subPub = { ...basePub, status: 'SUBMITTED', manuscriptFilePath: '/path/to/file.pdf' };
        render(<PublicationCard publication={subPub} user={user} />);
        expect(screen.getByText('View Manuscript')).toBeInTheDocument();
    });

    it('shows Download PDF for published with manuscript', () => {
        const pubWithFile = { ...basePub, manuscriptFilePath: '/path/to/file.pdf' };
        render(<PublicationCard publication={pubWithFile} user={user} />);
        expect(screen.getByText('Download PDF')).toBeInTheDocument();
    });
});
