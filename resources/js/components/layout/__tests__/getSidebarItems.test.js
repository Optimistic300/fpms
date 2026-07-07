import { describe, it, expect } from 'vitest';
import getSidebarItems from '../getSidebarItems';

describe('getSidebarItems', () => {
    it('returns workspace items for RESEARCHER', () => {
        const result = getSidebarItems('RESEARCHER');
        expect(result.workspace).toHaveLength(4);
        expect(result.workspace[0].label).toBe('Dashboard');
        expect(result.workspace[1].label).toBe('Projects');
        expect(result.workspace[2].label).toBe('My Activities');
        expect(result.workspace[3].label).toBe('Reports');
        expect(result.institute).toHaveLength(3);
        expect(result.roleSpecific).toHaveLength(0);
    });

    it('returns workspace items for STUDENT', () => {
        const result = getSidebarItems('STUDENT');
        expect(result.workspace).toHaveLength(4);
        expect(result.workspace[0].label).toBe('Dashboard');
    });

    it('returns role-specific items for SECRETARY', () => {
        const result = getSidebarItems('SECRETARY');
        expect(result.workspace).toHaveLength(1);
        expect(result.workspace[0].label).toBe('Projects');
        expect(result.roleSpecific).toHaveLength(2);
        expect(result.roleSpecific[0].label).toBe('Report Queue');
        expect(result.roleSpecific[1].label).toBe('Submission History');
        expect(result.institute).toHaveLength(3);
    });

    it('returns Division Overview for DIVISION_HEAD', () => {
        const result = getSidebarItems('DIVISION_HEAD');
        expect(result.workspace).toHaveLength(3);
        expect(result.workspace[0].label).toBe('Projects');
        expect(result.roleSpecific).toHaveLength(1);
        expect(result.roleSpecific[0].label).toBe('Division Overview');
    });

    it('returns Executive Dashboard for MANAGEMENT', () => {
        const result = getSidebarItems('MANAGEMENT');
        expect(result.workspace).toHaveLength(1);
        expect(result.workspace[0].label).toBe('Projects');
        expect(result.roleSpecific).toHaveLength(1);
        expect(result.roleSpecific[0].label).toBe('Executive Dashboard');
    });

    it('returns User Management and Settings for ADMIN', () => {
        const result = getSidebarItems('ADMIN');
        expect(result.workspace).toHaveLength(0);
        expect(result.roleSpecific).toHaveLength(2);
        expect(result.roleSpecific[0].label).toBe('User Management');
        expect(result.roleSpecific[1].label).toBe('Settings');
        expect(result.institute).toHaveLength(3);
    });

    it('includes badge indicators for Reports and Inbox', () => {
        const result = getSidebarItems('RESEARCHER');
        const reports = result.workspace.find((i) => i.label === 'Reports');
        expect(reports.badge).toBe('reports');
        const inbox = result.institute.find((i) => i.label === 'Inbox');
        expect(inbox.badge).toBe('inbox');
    });
});
