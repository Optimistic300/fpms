import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DocumentPreview from '../DocumentPreview';

const pdfDoc = {
    id: 1,
    title: 'Carbon Stock Assessment',
    type: 'PDF',
    fileName: 'report.pdf',
    uploadedBy: 'Yaa Asantewaa',
    uploadedAt: '2026-03-15T10:00:00Z',
};

const docxDoc = {
    id: 2,
    title: 'Agroforestry Study',
    type: 'DOCX',
    fileName: 'study.docx',
    author: 'Kofi Mensah',
    date: '2026-04-01',
};

describe('DocumentPreview', () => {
    const onClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders document title and metadata', () => {
        render(<DocumentPreview document={pdfDoc} onClose={onClose} />);
        expect(screen.getByText('Carbon Stock Assessment')).toBeInTheDocument();
        expect(screen.getByText('PDF')).toBeInTheDocument();
        expect(screen.getByText('Yaa Asantewaa')).toBeInTheDocument();
    });

    it('renders iframe for PDF documents', () => {
        render(<DocumentPreview document={pdfDoc} onClose={onClose} />);
        const iframe = document.querySelector('iframe');
        expect(iframe).toBeInTheDocument();
        expect(iframe.src).toContain('/api/documents/1/preview');
    });

    it('renders download prompt for non-PDF documents', () => {
        render(<DocumentPreview document={docxDoc} onClose={onClose} />);
        expect(screen.getByText('Preview not available')).toBeInTheDocument();
        expect(screen.getByText('Download to view')).toBeInTheDocument();
    });

    it('shows download link', () => {
        render(<DocumentPreview document={pdfDoc} onClose={onClose} />);
        const downloadLink = screen.getByText('Download');
        expect(downloadLink.closest('a').href).toContain('/api/documents/1/download');
    });

    it('calls onClose when close button clicked', async () => {
        const user = userEvent.setup();
        render(<DocumentPreview document={pdfDoc} onClose={onClose} />);
        await user.click(screen.getByText('✕'));
        expect(onClose).toHaveBeenCalled();
    });
});
