import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../useOnlineStatus', () => ({
    useOnlineStatus: vi.fn(() => ({ isOnline: true })),
}));

const mockEnqueueAiQuestion = vi.fn();
const mockGetAiQuestions = vi.fn();
const mockProcessAiQueue = vi.fn();

vi.mock('../../services/offlineQueue', () => ({
    enqueueAiQuestion: (...args) => mockEnqueueAiQuestion(...args),
    getAiQuestions: (...args) => mockGetAiQuestions(...args),
    processAiQueue: (...args) => mockProcessAiQueue(...args),
}));

vi.mock('../../api/axios', () => ({
    default: { post: vi.fn() },
}));

import { useAiQuestionQueue } from '../useAiQuestionQueue';

describe('useAiQuestionQueue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetAiQuestions.mockResolvedValue([]);
    });

    it('loads initial queued count', async () => {
        mockGetAiQuestions.mockResolvedValue([{ id: 1, question: 'Q1' }, { id: 2, question: 'Q2' }]);

        const { result } = renderHook(() => useAiQuestionQueue());
        await vi.waitFor(() => {
            expect(result.current.queuedCount).toBe(2);
        });
    });

    it('submits a question directly when online', async () => {
        const { result } = renderHook(() => useAiQuestionQueue());

        let response;
        await act(async () => {
            response = await result.current.submitQuestion('What is this?');
        });
        expect(response).toEqual({ sent: true });
        expect(mockEnqueueAiQuestion).not.toHaveBeenCalled();
    });

    it('queues a question when offline', async () => {
        const { useOnlineStatus } = await import('../useOnlineStatus');
        useOnlineStatus.mockReturnValue({ isOnline: false });

        const { result } = renderHook(() => useAiQuestionQueue());
        mockEnqueueAiQuestion.mockResolvedValue(1);

        let response;
        await act(async () => {
            response = await result.current.submitQuestion('Offline query?');
        });
        expect(response).toEqual({ sent: false, queued: true });
        expect(mockEnqueueAiQuestion).toHaveBeenCalledWith('Offline query?');
    });

    it('processes AI questions when coming back online', async () => {
        mockGetAiQuestions.mockResolvedValue([{ id: 1, question: 'Q' }]);
        mockProcessAiQueue.mockResolvedValue({ processed: 1 });

        const { useOnlineStatus } = await import('../useOnlineStatus');
        useOnlineStatus.mockReturnValue({ isOnline: false });

        const { result, rerender } = renderHook(() => useAiQuestionQueue());

        await vi.waitFor(() => {
            expect(mockGetAiQuestions).toHaveBeenCalled();
        });

        mockProcessAiQueue.mockResolvedValue({ processed: 1 });
        useOnlineStatus.mockReturnValue({ isOnline: true });

        await act(async () => {
            rerender();
        });

        await vi.waitFor(() => {
            expect(mockProcessAiQueue).toHaveBeenCalled();
        });
    });
});
