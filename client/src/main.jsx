import { StrictMode, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const rootEl = document.getElementById('root');

const renderFatal = (title, details = '') => {
  if (!rootEl) return;
  rootEl.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f8ff;padding:24px;font-family:Segoe UI,Arial,sans-serif;">
      <div style="max-width:760px;width:100%;background:#fff;border:1px solid #ffd0d0;border-radius:14px;padding:18px;box-shadow:0 10px 28px rgba(0,0,0,.08);">
        <div style="font-size:20px;font-weight:700;color:#c62828;margin-bottom:10px;">${title}</div>
        <pre style="white-space:pre-wrap;word-break:break-word;background:#fff4f4;border:1px solid #ffdede;border-radius:10px;padding:12px;color:#8a1f1f;font-size:12px;line-height:1.45;">${String(details || '').replace(/</g, '&lt;')}</pre>
      </div>
    </div>
  `;
};

window.addEventListener('error', (event) => {
  renderFatal('Runtime error while loading DevConnect', event?.error?.stack || event?.message || 'Unknown runtime error');
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event?.reason;
  renderFatal('Unhandled promise rejection while loading DevConnect', reason?.stack || reason?.message || String(reason));
});

if (!rootEl) {
  throw new Error('Root element #root was not found in index.html');
}

import('./App.jsx')
  .then(({ default: AppComponent }) => {
    createRoot(rootEl).render(
      createElement(StrictMode, null, createElement(AppComponent))
    );
  })
  .catch((error) => {
    renderFatal('Failed to import App.jsx', error?.stack || error?.message || String(error));
  });
