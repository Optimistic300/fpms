import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '../useOnlineStatus';

describe('useOnlineStatus', () => {
    beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', {
            configurable: true,
            value: true,
            writable: true,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns true when online', () => {
        const { result } = renderHook(() => useOnlineStatus());
        expect(result.current.isOnline).toBe(true);
    });

    it('returns false when offline', () => {
        Object.defineProperty(navigator, 'onLine', {
            configurable: true,
            value: false,
            writable: true,
        });
        const { result } = renderHook(() => useOnlineStatus());
        expect(result.current.isOnline).toBe(false);
    });

    it('updates isOnline on online event', () => {
        Object.defineProperty(navigator, 'onLine', {
            configurable: true,
            value: false,
            writable: true,
        });
        const { result } = renderHook(() => useOnlineStatus());
        expect(result.current.isOnline).toBe(false);

        act(() => {
            Object.defineProperty(navigator, 'onLine', {
                configurable: true,
                value: true,
                writable: true,
            });
            window.dispatchEvent(new Event('online'));
        });
        expect(result.current.isOnline).toBe(true);
    });

    it('updates isOnline on offline event', () => {
        const { result } = renderHook(() => useOnlineStatus());
        expect(result.current.isOnline).toBe(true);

        act(() => {
            Object.defineProperty(navigator, 'onLine', {
                configurable: true,
                value: false,
                writable: true,
            });
            window.dispatchEvent(new Event('offline'));
        });
        expect(result.current.isOnline).toBe(false);
    });

    it('removes event listeners on unmount', () => {
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

        const { unmount } = renderHook(() => useOnlineStatus());
        expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
        expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

        unmount();
        expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });
});
