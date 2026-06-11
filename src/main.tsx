import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Handle global unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Gracefully log instead of crashing or showing noisy overlays
  const reason = event.reason?.message || String(event.reason);
  const transportErrors = [
    'WebSocket',
    'EventSource',
  ];
  
  if (transportErrors.some(err => reason.toLowerCase().includes(err.toLowerCase()))) {
    // Suppress noisy transport errors in development environments with aggressive HMR/SSE
    event.preventDefault();
    return;
  }
  console.warn('Unhandled promise rejection:', event.reason);
});

// Handle global errors
window.addEventListener('error', (event) => {
  const msg = event.message || '';
  const transportErrors = [
    'WebSocket',
    'EventSource',
  ];

  if (transportErrors.some(err => msg.toLowerCase().includes(err.toLowerCase()))) {
    // Suppress noisy transport errors in development
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
