import './app.css';

import { createRoot } from 'react-dom/client';
import App from './App';
import { replayOfflineQueue } from './services/axios';
import { processAiQueue } from './services/offlineQueue';
import axiosInstance from './services/axios';

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
    });
}

window.addEventListener('online', () => {
    replayOfflineQueue();
    processAiQueue(axiosInstance);
});

const root = createRoot(document.getElementById('root'));
root.render(<App />);
