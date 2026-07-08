import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FileAttachStep from '../FileAttachStep';

describe('FileAttachStep', () => {
    it('renders the file upload zone and skip hint', () => {
        render(<FileAttachStep files={[]} onAddFiles={vi.fn()} onRemoveFile={vi.fn()} />);
        expect(screen.getByText('Drag & drop files here, or click to browse')).toBeInTheDocument();
        expect(screen.getByText(/You can skip this step/)).toBeInTheDocument();
    });
});
