import './app.css';

import { createRoot } from 'react-dom/client';
import App from './App';
import { replayOfflineQueue } from './services/axios';

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
    });
}

window.addEventListener('online', () => {
    replayOfflineQueue();
});

const root = createRoot(document.getElementById('root'));
root.render(<App />);
