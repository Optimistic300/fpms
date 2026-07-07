const DB_NAME = 'skms-offline';
const DB_VERSION = 1;
const MUTATIONS_STORE = 'mutations';
const AI_STORE = 'aiQuestions';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(MUTATIONS_STORE)) {
                const store = db.createObjectStore(MUTATIONS_STORE, {
                    keyPath: 'id',
                    autoIncrement: true,
                });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('retryCount', 'retryCount', { unique: false });
            }
            if (!db.objectStoreNames.contains(AI_STORE)) {
                const aiStore = db.createObjectStore(AI_STORE, {
                    keyPath: 'id',
                    autoIncrement: true,
                });
                aiStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function enqueue(method, url, body = null) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(MUTATIONS_STORE, 'readwrite');
        const store = tx.objectStore(MUTATIONS_STORE);
        const item = {
            method,
            url,
            body,
            timestamp: Date.now(),
            retryCount: 0,
        };
        const request = store.add(item);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
    });
}

export async function dequeue() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(MUTATIONS_STORE, 'readonly');
        const store = tx.objectStore(MUTATIONS_STORE);
        const index = store.index('timestamp');
        const request = index.openCursor(null, 'next');
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                resolve(cursor.value);
            } else {
                resolve(null);
            }
        };
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
    });
}

export async function removeFromQueue(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(MUTATIONS_STORE, 'readwrite');
        const store = tx.objectStore(MUTATIONS_STORE);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
    });
}

export async function updateRetryCount(id, retryCount) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(MUTATIONS_STORE, 'readwrite');
        const store = tx.objectStore(MUTATIONS_STORE);
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
            const item = getRequest.result;
            if (item) {
                item.retryCount = retryCount;
                store.put(item);
            }
            resolve();
        };
        getRequest.onerror = () => reject(getRequest.error);
        tx.oncomplete = () => db.close();
    });
}

export async function getAllMutations() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(MUTATIONS_STORE, 'readonly');
        const store = tx.objectStore(MUTATIONS_STORE);
        const index = store.index('timestamp');
        const request = index.getAll(null, Infinity);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
    });
}

const MAX_RETRIES = 3;

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function processQueue(axiosInstance) {
    const items = await getAllMutations();
    if (!items.length) return { processed: 0, failed: 0 };

    let processed = 0;
    let failed = 0;

    for (const item of items) {
        if (item.retryCount >= MAX_RETRIES) {
            await removeFromQueue(item.id);
            failed++;
            continue;
        }

        try {
            const config = {
                method: item.method.toLowerCase(),
                url: item.url,
            };
            if (item.body && item.method.toUpperCase() !== 'GET') {
                config.data = item.body;
            }
            await axiosInstance(config);
            await removeFromQueue(item.id);
            processed++;
        } catch (error) {
            if (error.response && error.response.status < 500) {
                await removeFromQueue(item.id);
                failed++;
            } else {
                const newRetryCount = item.retryCount + 1;
                await updateRetryCount(item.id, newRetryCount);
                failed++;
                if (newRetryCount < MAX_RETRIES) {
                    await delay(Math.pow(2, newRetryCount) * 1000);
                }
            }
        }
    }

    return { processed, failed };
}

export async function enqueueAiQuestion(question) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(AI_STORE, 'readwrite');
        const store = tx.objectStore(AI_STORE);
        const item = {
            question,
            timestamp: Date.now(),
        };
        const request = store.add(item);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
    });
}

export async function getAiQuestions() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(AI_STORE, 'readonly');
        const store = tx.objectStore(AI_STORE);
        const index = store.index('timestamp');
        const request = index.getAll(null, Infinity);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
    });
}

export async function removeAiQuestion(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(AI_STORE, 'readwrite');
        const store = tx.objectStore(AI_STORE);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
    });
}

export async function processAiQueue(axiosInstance) {
    const questions = await getAiQuestions();
    if (!questions.length) return { processed: 0 };

    let processed = 0;
    for (const item of questions) {
        try {
            await axiosInstance.post('/api/ai/ask', { question: item.question });
            await removeAiQuestion(item.id);
            processed++;
        } catch {
            break;
        }
    }
    return { processed };
}
