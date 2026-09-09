import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { PreviewContentProvider } from '../contexts/ContentContext.jsx';
import { siteContent } from '../content.js';
import { mergeSections } from '../content-source/source.js';
import { acceptPreview, previewImages } from './preview-contract.js';
import { validateSection, SECTION_SCHEMAS } from '../content-source/schema.js';
import Home from '../pages/Home.jsx';
import Contact from '../pages/Contact.jsx';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
export default function PreviewPage() {
  const surface = useRef(null);
  const [content,setContent] = useState(null), [page,setPage] = useState('home');
  useEffect(() => {
    if (window.parent === window) return undefined;
    const receive = e => {
      if (!acceptPreview(e,window.parent,window.location.origin)) return;
      const rows = e.data.payload.sections;
      if (rows.length !== 12 || new Set(rows.map(r => r.id)).size !== 12 || rows.some(r => !SECTION_SCHEMAS[r.id] || validateSection(r.id,r.data).length)) return;
      setPage(e.data.payload.page === 'contact' ? 'contact' : 'home');
      setContent(previewImages(mergeSections(siteContent,rows)));
    };
    window.addEventListener('message',receive);
    window.parent.postMessage({ type: 'cms-preview-ready' },window.location.origin);
    return () => window.removeEventListener('message',receive);
  }, []);
  // Remove navigable attributes as well as cancelling events, including
  // context-menu and drag navigation. Content remains ordinary escaped JSX.
  useLayoutEffect(() => {
    surface.current?.querySelectorAll('a').forEach(link => {
      for (const attribute of ['href','target','ping','download']) link.removeAttribute(attribute);
      link.setAttribute('aria-disabled','true');
    });
  }, [content, page]);
  if (!content) return <p>Open preview from Boss Content. Waiting for a private snapshot.</p>;
  const stop = e => { e.preventDefault(); e.stopPropagation(); };
  return <MemoryRouter><PreviewContentProvider content={content}>
    <div ref={surface} onContextMenuCapture={stop} onDragStartCapture={stop} onClickCapture={stop} onAuxClickCapture={stop} onSubmitCapture={stop} onKeyDownCapture={e => { if (e.key === 'Enter' || e.key === ' ') stop(e); }}>
      <Header />{page === 'home' ? <Home /> : <Contact />}<Footer />
    </div>
  </PreviewContentProvider></MemoryRouter>;
}
