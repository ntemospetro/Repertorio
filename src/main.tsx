import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safely suppress harmless third-party browser extension / performance observer errors
if (typeof window !== 'undefined') {
  const shouldSuppress = (msg: string) => {
    return (
      msg.includes("startTime") ||
      msg.includes("reportAllChanges") ||
      msg.includes("message port closed") ||
      msg.includes("ResizeObserver loop")
    );
  };

  window.addEventListener(
    'error',
    (event) => {
      const msg = event.message || event.error?.message || String(event.error || '');
      if (shouldSuppress(msg)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const reasonMsg = event.reason?.message || String(event.reason || '');
      if (shouldSuppress(reasonMsg)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

