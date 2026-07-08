import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActivityFormStep from '../ActivityFormStep';

const projects = [
    { id: 1, title: 'Forest Carbon Study' },
    { id: 2, title: 'Soil Analysis' },
];

const activityTypes = [
    { id: 1, name: 'Field Survey' },
    { id: 2, name: 'Lab Analysis' },
];

const defaultForm = {
    projectId: '',
    date: '2026-07-08',
    activityTypeId: '',
    description: '',
    notes: '',
};

describe('ActivityFormStep', () => {
    it('renders all form fields', () => {
        render(
            <ActivityFormStep
                formData={defaultForm}
                onChange={vi.fn()}
                errors={null}
                projects={projects}
                activityTypes={activityTypes}
            />
        );
        expect(screen.getByText('Project *')).toBeInTheDocument();
        expect(screen.getByText('Date *')).toBeInTheDocument();
        expect(screen.getByText('Activity Type *')).toBeInTheDocument();
        expect(screen.getByText('Description *')).toBeInTheDocument();
        expect(screen.getByText('Notes')).toBeInTheDocument();
    });

    it('shows validation errors', () => {
        const errors = { projectId: 'Project is required.', description: 'Description is required.' };
        render(
            <ActivityFormStep
                formData={defaultForm}
                onChange={vi.fn()}
                errors={errors}
                projects={projects}
                activityTypes={activityTypes}
            />
        );
        expect(screen.getByText('Project is required.')).toBeInTheDocument();
        expect(screen.getByText('Description is required.')).toBeInTheDocument();
    });

    it('calls onChange when description is typed', () => {
        const onChange = vi.fn();
        render(
            <ActivityFormStep
                formData={defaultForm}
                onChange={onChange}
                errors={null}
                projects={projects}
                activityTypes={activityTypes}
            />
        );
        fireEvent.change(screen.getByPlaceholderText('Brief description of the activity'), {
            target: { value: 'Test activity' },
        });
        expect(onChange).toHaveBeenCalledWith('description', 'Test activity');
    });
});
