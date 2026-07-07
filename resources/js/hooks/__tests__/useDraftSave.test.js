import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDraftSave } from '../useDraftSave';

vi.mock('../useOnlineStatus', () => ({
    useOnlineStatus: vi.fn(() => ({ isOnline: true })),
}));

describe('useDraftSave', () => {
    beforeEach(() => {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('skms-draft-')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('saves a draft and updates state', () => {
        const { result } = renderHook(() => useDraftSave('test-1'));
        expect(result.current.draftExists).toBe(false);

        act(() => {
            result.current.save({ title: 'My Report' });
        });
        expect(result.current.draftExists).toBe(true);
        expect(result.current.lastSaved).toBeInstanceOf(Date);

        const stored = JSON.parse(localStorage.getItem('skms-draft-test-1'));
        expect(stored.data).toEqual({ title: 'My Report' });
    });

    it('restores a saved draft', () => {
        localStorage.setItem('skms-draft-test-1', JSON.stringify({ data: { title: 'Draft' }, savedAt: Date.now() }));
        const { result } = renderHook(() => useDraftSave('test-1'));
        expect(result.current.draftExists).toBe(true);

        const restored = result.current.restore();
        expect(restored).toEqual({ title: 'Draft' });
    });

    it('returns null when no draft exists', () => {
        const { result } = renderHook(() => useDraftSave('nonexistent'));
        expect(result.current.restore()).toBeNull();
    });

    it('clears a draft', () => {
        localStorage.setItem('skms-draft-test-1', JSON.stringify({ data: { x: 1 } }));
        const { result } = renderHook(() => useDraftSave('test-1'));

        act(() => {
            result.current.clear();
        });
        expect(result.current.draftExists).toBe(false);
        expect(localStorage.getItem('skms-draft-test-1')).toBeNull();
    });

    it('auto-saves with debounce', () => {
        const { result } = renderHook(() => useDraftSave('test-1'));

        act(() => {
            result.current.autoSave({ field: 'value' });
        });

        expect(localStorage.getItem('skms-draft-test-1')).toBeNull();

        act(() => {
            vi.advanceTimersByTime(500);
        });

        const stored = JSON.parse(localStorage.getItem('skms-draft-test-1'));
        expect(stored.data).toEqual({ field: 'value' });
    });

    it('debounce replaces previous timer on rapid calls', () => {
        const { result } = renderHook(() => useDraftSave('test-1'));

        act(() => {
            result.current.autoSave({ field: 'first' });
        });
        act(() => {
            vi.advanceTimersByTime(200);
        });
        act(() => {
            result.current.autoSave({ field: 'second' });
        });
        act(() => {
            vi.advanceTimersByTime(500);
        });

        const stored = JSON.parse(localStorage.getItem('skms-draft-test-1'));
        expect(stored.data).toEqual({ field: 'second' });
    });
});
