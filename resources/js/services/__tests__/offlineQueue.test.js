import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';

import {
    enqueue,
    dequeue,
    removeFromQueue,
    updateRetryCount,
    getAllMutations,
    processQueue,
    enqueueAiQuestion,
    getAiQuestions,
    removeAiQuestion,
    processAiQueue,
} from '../offlineQueue';

describe('offlineQueue mutation store', () => {
    beforeEach(async () => {
        const dbs = await indexedDB.databases();
        for (const db of dbs) {
            indexedDB.deleteDatabase(db.name);
        }
    });

    it('enqueues a mutation and dequeues in FIFO order', async () => {
        await enqueue('POST', '/api/activities', { text: 'first' });
        await enqueue('POST', '/api/activities', { text: 'second' });

        const first = await dequeue();
        expect(first).not.toBeNull();
        expect(first.method).toBe('POST');
        expect(first.url).toBe('/api/activities');
        expect(first.body).toEqual({ text: 'first' });
        expect(first.retryCount).toBe(0);
        expect(first.timestamp).toBeTypeOf('number');
        expect(first.id).toBeTypeOf('number');
    });

    it('returns null from dequeue when queue is empty', async () => {
        const item = await dequeue();
        expect(item).toBeNull();
    });

    it('removes an item from the queue', async () => {
        const id = await enqueue('DELETE', '/api/projects/1');
        await removeFromQueue(id);
        const item = await dequeue();
        expect(item).toBeNull();
    });

    it('updates retry count', async () => {
        const id = await enqueue('PUT', '/api/projects/1', { name: 'x' });
        await updateRetryCount(id, 1);
        const items = await getAllMutations();
        const item = items.find((i) => i.id === id);
        expect(item).toBeDefined();
        expect(item.retryCount).toBe(1);
    });

    it('getAllMutations returns items in timestamp order', async () => {
        await enqueue('POST', '/api/test1', { n: 1 });
        await enqueue('POST', '/api/test2', { n: 2 });
        await enqueue('POST', '/api/test3', { n: 3 });
        const items = await getAllMutations();
        expect(items).toHaveLength(3);
        for (let i = 1; i < items.length; i++) {
            expect(items[i].timestamp).toBeGreaterThanOrEqual(items[i - 1].timestamp);
        }
    });
});

describe('offlineQueue processQueue', () => {
    beforeEach(async () => {
        const dbs = await indexedDB.databases();
        for (const db of dbs) {
            indexedDB.deleteDatabase(db.name);
        }
    });

    it('processes queued mutations successfully', async () => {
        await enqueue('POST', '/api/activities', { text: 'field log' });

        const mockAxios = vi.fn().mockResolvedValue({ data: { id: 1 } });

        const result = await processQueue(mockAxios);
        expect(result.processed).toBe(1);
        expect(result.failed).toBe(0);

        const remaining = await getAllMutations();
        expect(remaining).toHaveLength(0);

        expect(mockAxios).toHaveBeenCalledWith({
            method: 'post',
            url: '/api/activities',
            data: { text: 'field log' },
        });
    });

    it('removes item on 4xx response', async () => {
        await enqueue('POST', '/api/activities', { text: 'bad' });

        const mockAxios = vi.fn().mockRejectedValue({ response: { status: 422 } });
        const result = await processQueue(mockAxios);
        expect(result.processed).toBe(0);
        expect(result.failed).toBe(1);

        const remaining = await getAllMutations();
        expect(remaining).toHaveLength(0);
    });

    it('retries on network error up to 3 times then removes', async () => {
        await enqueue('POST', '/api/activities', { text: 'retry me' });

        const mockAxios = vi.fn().mockRejectedValue(new Error('Network error'));

        async function runProcessQueue() {
            return processQueue(mockAxios);
        }

        let remaining;
        const result1 = await runProcessQueue();
        expect(result1.failed).toBe(1);
        remaining = await getAllMutations();
        expect(remaining).toHaveLength(1);
        expect(remaining[0].retryCount).toBe(1);

        const result2 = await runProcessQueue();
        expect(result2.failed).toBe(1);
        remaining = await getAllMutations();
        expect(remaining).toHaveLength(1);
        expect(remaining[0].retryCount).toBe(2);

        const result3 = await runProcessQueue();
        expect(result3.failed).toBe(1);
        remaining = await getAllMutations();
        expect(remaining).toHaveLength(1);
        expect(remaining[0].retryCount).toBe(3);

        const result4 = await runProcessQueue();
        expect(result4.failed).toBe(1);
        remaining = await getAllMutations();
        expect(remaining).toHaveLength(0);
    }, 60000);
});

describe('offlineQueue AI question store', () => {
    beforeEach(async () => {
        const dbs = await indexedDB.databases();
        for (const db of dbs) {
            indexedDB.deleteDatabase(db.name);
        }
    });

    it('enqueues AI questions and retrieves them in order', async () => {
        await enqueueAiQuestion('What is this project?');
        await enqueueAiQuestion('Who are the researchers?');

        const questions = await getAiQuestions();
        expect(questions).toHaveLength(2);
        expect(questions[0].question).toBe('What is this project?');
        expect(questions[1].question).toBe('Who are the researchers?');
    });

    it('removes an AI question', async () => {
        const id = await enqueueAiQuestion('Test question');
        await removeAiQuestion(id);
        const questions = await getAiQuestions();
        expect(questions).toHaveLength(0);
    });
});

describe('offlineQueue processAiQueue', () => {
    beforeEach(async () => {
        const dbs = await indexedDB.databases();
        for (const db of dbs) {
            indexedDB.deleteDatabase(db.name);
        }
    });

    it('processes AI questions and removes them on success', async () => {
        await enqueueAiQuestion('Q1');
        await enqueueAiQuestion('Q2');

        const mockAxios = {
            post: vi.fn().mockResolvedValue({ data: { answer: 'A' } }),
        };
        const result = await processAiQueue(mockAxios);
        expect(result.processed).toBe(2);

        const remaining = await getAiQuestions();
        expect(remaining).toHaveLength(0);
    });

    it('stops processing on first failure and keeps remaining', async () => {
        await enqueueAiQuestion('Q1');
        await enqueueAiQuestion('Q2');

        const mockAxios = {
            post: vi.fn()
                .mockResolvedValueOnce({ data: { answer: 'A' } })
                .mockRejectedValueOnce(new Error('Server error')),
        };
        const result = await processAiQueue(mockAxios);
        expect(result.processed).toBe(1);

        const remaining = await getAiQuestions();
        expect(remaining).toHaveLength(1);
        expect(remaining[0].question).toBe('Q2');
    });
});
