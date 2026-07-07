import { describe, it, expect, beforeEach } from 'vitest';
import { saveDraft, getDraft, clearDraft, getAllDraftKeys } from '../draftStorage';

describe('draftStorage', () => {
    beforeEach(() => {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('skms-draft-')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
    });

    it('saves and retrieves a draft', () => {
        const result = saveDraft('report-1', { title: 'Field Report', content: 'Notes' });
        expect(result).toBe(true);

        const draft = getDraft('report-1');
        expect(draft).toEqual({ title: 'Field Report', content: 'Notes' });
    });

    it('returns null for missing draft', () => {
        expect(getDraft('nonexistent')).toBeNull();
    });

    it('clears a draft', () => {
        saveDraft('report-1', { title: 'Test' });
        expect(getDraft('report-1')).not.toBeNull();

        const cleared = clearDraft('report-1');
        expect(cleared).toBe(true);
        expect(getDraft('report-1')).toBeNull();
    });

    it('lists all draft keys', () => {
        saveDraft('a', { x: 1 });
        saveDraft('b', { y: 2 });

        const keys = getAllDraftKeys();
        expect(keys).toContain('a');
        expect(keys).toContain('b');
        expect(keys.length).toBe(2);
    });

    it('handles localStorage quota error gracefully', () => {
        const originalSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = () => { throw new Error('QuotaExceededError'); };

        const result = saveDraft('fail', { data: 'x' });
        expect(result).toBe(false);

        Storage.prototype.setItem = originalSetItem;

        const draft = getDraft('fail');
        expect(draft).toBeNull();
    });

    it('handles JSON parse failure gracefully', () => {
        localStorage.setItem('skms-draft-corrupt', '{invalid json}');
        expect(getDraft('corrupt')).toBeNull();
    });

    it('handles localStorage removeItem failure gracefully', () => {
        const originalRemoveItem = Storage.prototype.removeItem;
        Storage.prototype.removeItem = () => { throw new Error('Storage failure'); };

        const result = clearDraft('nonexistent');
        expect(result).toBe(false);

        Storage.prototype.removeItem = originalRemoveItem;
    });
});
