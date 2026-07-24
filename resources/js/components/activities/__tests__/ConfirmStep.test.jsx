import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConfirmStep from '../ConfirmStep';

const projects = [{ id: 1, title: 'Forest Carbon Study' }];
const activityTypes = [{ id: 1, name: 'Field Survey' }];
const formData = {
    projectId: '1',
    date: '2026-07-08',
    activityTypeId: '1',
    description: 'Field visit',
    notes: 'Collected samples',
};

describe('ConfirmStep', () => {
    it('displays all form data in summary', () => {
        render(
            <ConfirmStep
                formData={formData}
                files={[]}
                submitting={false}
                uploadProgress={{}}
                fileErrors={{}}
                onRetry={vi.fn()}
                projects={projects}
                activityTypes={activityTypes}
            />
        );
        expect(screen.getByText('Review & Confirm')).toBeInTheDocument();
        expect(screen.getByText('Forest Carbon Study')).toBeInTheDocument();
        expect(screen.getByText('2026-07-08')).toBeInTheDocument();
        expect(screen.getByText('Field Survey')).toBeInTheDocument();
        expect(screen.getByText('Field visit')).toBeInTheDocument();
        expect(screen.getByText('Collected samples')).toBeInTheDocument();
    });

    it('shows no files attached message', () => {
        render(
            <ConfirmStep
                formData={formData}
                files={[]}
                submitting={false}
                uploadProgress={{}}
                fileErrors={{}}
                onRetry={vi.fn()}
                projects={projects}
                activityTypes={activityTypes}
            />
        );
        expect(screen.getByText('No files attached')).toBeInTheDocument();
    });

    it('displays file list when files are present', () => {
        const files = [new File([''], 'report.pdf', { type: 'application/pdf' })];
        Object.defineProperty(files[0], 'size', { value: 2048 });
        render(
            <ConfirmStep
                formData={formData}
                files={files}
                submitting={false}
                uploadProgress={{}}
                fileErrors={{}}
                onRetry={vi.fn()}
                projects={projects}
                activityTypes={activityTypes}
            />
        );
        expect(screen.getByText('report.pdf')).toBeInTheDocument();
    });
});
