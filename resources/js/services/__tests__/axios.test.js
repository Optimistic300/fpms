import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';

const mockInstanceRequest = vi.fn();

const mockAxiosInstance = Object.assign(
    vi.fn((config) => mockInstanceRequest(config)),
    {
        defaults: { baseURL: '/api' },
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
        request: mockInstanceRequest,
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    }
);

vi.mock('axios', () => {
    const mockAxios = Object.assign(
        vi.fn((config) => mockInstanceRequest(config)),
        {
            create: vi.fn(() => mockAxiosInstance),
            defaults: { baseURL: '/api' },
            interceptors: {
                request: { use: vi.fn() },
                response: { use: vi.fn() },
            },
            request: mockInstanceRequest,
            get: vi.fn(),
            post: vi.fn(),
            put: vi.fn(),
            patch: vi.fn(),
            delete: vi.fn(),
        }
    );
    return { default: mockAxios };
});

describe('axios integration', () => {
    beforeEach(async () => {
        const dbs = await indexedDB.databases();
        for (const db of dbs) {
            indexedDB.deleteDatabase(db.name);
        }

        Object.defineProperty(navigator, 'onLine', {
            configurable: true,
            value: true,
            writable: true,
        });

        vi.resetModules();
        localStorage.removeItem('auth_token');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('exports replayOfflineQueue function', async () => {
        const axiosModule = await import('../axios');
        expect(axiosModule.replayOfflineQueue).toBeTypeOf('function');
    });

    it('interceptors are registered on import', async () => {
        const axios = await import('axios');
        const axiosModule = await import('../axios');

        expect(axios.default.create).toHaveBeenCalled();
        const instance = axios.default.create.mock.results[0].value;
        expect(instance.interceptors.request.use).toHaveBeenCalled();
        expect(instance.interceptors.response.use).toHaveBeenCalled();
    });

    it('replayOfflineQueue processes queued mutations', async () => {
        const { enqueue } = await import('../offlineQueue');
        await enqueue('POST', '/api/activities', { text: 'field log' });

        const axiosModule = await import('../axios');
        mockInstanceRequest.mockResolvedValue({ data: { id: 1 } });

        const result = await axiosModule.replayOfflineQueue();
        expect(result.processed).toBe(1);
        expect(result.failed).toBe(0);
    });

    it('replayOfflineQueue returns cached promise for concurrent calls', async () => {
        const { enqueue } = await import('../offlineQueue');
        await enqueue('POST', '/api/activities', { text: 'first' });

        const axiosModule = await import('../axios');
        mockInstanceRequest.mockResolvedValue({ data: { id: 1 } });

        const [r1, r2] = await Promise.all([
            axiosModule.replayOfflineQueue(),
            axiosModule.replayOfflineQueue(),
        ]);
        expect(r1.processed).toBe(1);
        expect(r2.processed).toBe(1);
    });
});
