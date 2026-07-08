import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FileUploadZone from '../FileUploadZone';

describe('FileUploadZone', () => {
    it('renders the drop zone text', () => {
        render(<FileUploadZone files={[]} onAddFiles={vi.fn()} onRemoveFile={vi.fn()} />);
        expect(screen.getByText('Drag & drop files here, or click to browse')).toBeInTheDocument();
    });

    it('displays queued files with name and size', () => {
        const files = [new File([''], 'test.pdf', { type: 'application/pdf' })];
        Object.defineProperty(files[0], 'size', { value: 1024 });
        render(<FileUploadZone files={files} onAddFiles={vi.fn()} onRemoveFile={vi.fn()} />);
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
        expect(screen.getByText('1.0 KB')).toBeInTheDocument();
    });

    it('calls onRemoveFile when remove button is clicked', () => {
        const onRemove = vi.fn();
        const files = [new File([''], 'doc.pdf', { type: 'application/pdf' })];
        render(<FileUploadZone files={files} onAddFiles={vi.fn()} onRemoveFile={onRemove} />);
        fireEvent.click(screen.getByLabelText('Remove doc.pdf'));
        expect(onRemove).toHaveBeenCalledWith(0);
    });
});
