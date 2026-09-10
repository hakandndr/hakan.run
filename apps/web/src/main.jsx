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
} else {
  import('./public/PublicBootstrap.jsx').then(({ default: PublicBootstrap }) => mount(PublicBootstrap));
}
