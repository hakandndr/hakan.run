import React from 'react';
import { flushSync } from 'react-dom';
import ReactDOM from 'react-dom/client';
import '@/index.css';

const pathname = window.location.pathname;
const preview = pathname === '/boss/content/preview';
const boss = pathname === '/boss' || pathname.startsWith('/boss/');

const mount = (Component) => {
  const root = document.getElementById('root');
  root.replaceChildren();
  const reactRoot = ReactDOM.createRoot(root);
  flushSync(() => reactRoot.render(<Component />));
};

if (preview) {
  import('./boss/PreviewPage.jsx').then(({ default: PreviewPage }) => mount(PreviewPage));
} else if (boss) {
  import('./boss/BossApplication.jsx').then(({ default: BossApplication }) => mount(BossApplication));
} else if (pathname === '/notes' || pathname.startsWith('/notes/')) {
  // Notes HTML is built from the Markdown source. Keep that readable while the
  // published site snapshot loads, and if the snapshot is temporarily unavailable.
  Promise.all([
    import('./Application.jsx'),
    import('./content-source/published-site.js'),
    import('./content-source/visual-tokens.js'),
  ]).then(async ([{ default: Application }, { loadPublishedSiteSnapshot }, { applyPublishedVisualTokens }]) => {
    try {
      const snapshot = await loadPublishedSiteSnapshot();
      applyPublishedVisualTokens(snapshot.content);
      mount(() => <Application snapshot={snapshot} />);
    } catch (error) {
      console.error('[Notes bootstrap]', error.code ?? 'unknown_error');
    }
  }).catch((error) => {
    console.error('[Notes bootstrap]', error.code ?? 'module_error');
  });
} else {
  import('./public/PublicBootstrap.jsx').then(({ default: PublicBootstrap }) => mount(PublicBootstrap));
}
