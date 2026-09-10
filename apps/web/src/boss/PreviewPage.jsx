import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { applyPublishedVisualTokens, PreviewContentProvider } from '../contexts/ContentContext.jsx';
import { createPublishedSiteSnapshot } from '../content-source/published-site.js';
import { acceptPreview, previewImages } from './preview-contract.js';
import { PublicPreviewRenderer } from '../public/PublicRenderer.jsx';
export default function PreviewPage() {
  const surface = useRef(null);
  const [snapshot,setSnapshot] = useState(null), [page,setPage] = useState('home');
  const [error,setError] = useState(false);
  useEffect(() => {
    if (window.parent === window) return undefined;
    const receive = e => {
      if (!acceptPreview(e,window.parent,window.location.origin)) return;
      try {
        const rows = e.data.payload.sections.map((row) => ({
          ...row,
          publishedAt: row.updatedAt,
          data: previewImages(row.data),
        }));
        const publishedAt = Math.max(...rows.map((row) => row.publishedAt));
        const next = createPublishedSiteSnapshot({
          contract: 1,
          count: rows.length,
          publishedAt,
          sections: rows,
        });
        applyPublishedVisualTokens(next.content);
        setPage(e.data.payload.page === 'contact' ? 'contact' : 'home');
        setSnapshot(next);
        setError(false);
      } catch {
        setSnapshot(null);
        setError(true);
      }
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
  }, [snapshot, page]);
  if (error) return <p>Preview unavailable: the private snapshot is incomplete or invalid.</p>;
  if (!snapshot) return <p>Open preview from Boss Content. Waiting for a private snapshot.</p>;
  const stop = e => { e.preventDefault(); e.stopPropagation(); };
  return <MemoryRouter><PreviewContentProvider snapshot={snapshot}>
    <div ref={surface} onContextMenuCapture={stop} onDragStartCapture={stop} onClickCapture={stop} onAuxClickCapture={stop} onSubmitCapture={stop} onKeyDownCapture={e => { if (e.key === 'Enter' || e.key === ' ') stop(e); }}>
      <PublicPreviewRenderer page={page} />
    </div>
  </PreviewContentProvider></MemoryRouter>;
}
