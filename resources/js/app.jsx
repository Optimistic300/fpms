import './app.css';

import { createRoot } from 'react-dom/client';
import App from './App';
import apiClient, { replayOfflineQueue } from './api/axios';
import { processAiQueue } from './services/offlineQueue';

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
    });
}

window.addEventListener('online', () => {
    replayOfflineQueue();
    processAiQueue(apiClient);
});

const root = createRoot(document.getElementById('root'));
root.render(<App />);
