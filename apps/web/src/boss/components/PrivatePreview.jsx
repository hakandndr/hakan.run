import React, { useEffect, useRef, useState } from 'react';
import { fetchBoss } from '../api.js';
import { composePreview, PREVIEW_PATH } from '../preview-contract.js';
export default function PrivatePreview({ request, onClose }) {
  const frame = useRef(null);
  const [page,setPage] = useState('home');
  const [payload,setPayload] = useState(null), [error,setError] = useState(''), [width,setWidth] = useState('100%');
  useEffect(() => {
    const controller = new AbortController();
    setPayload(null); setError('');
    fetchBoss('/api/boss/content/preview', { signal: controller.signal }).then(snapshot => setPayload(composePreview(snapshot,request))).catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, [request]);
  useEffect(() => {
    if (!payload) return undefined;
    const send = () => frame.current?.contentWindow?.postMessage({ type: 'cms-preview', payload: { ...payload, page } }, window.location.origin);
    send();
    const receive = e => {
      if (e.origin === window.location.origin && e.source === frame.current?.contentWindow && e.data?.type === 'cms-preview-ready') send();
    };
    window.addEventListener('message',receive);
    return () => window.removeEventListener('message',receive);
  }, [payload, page]);
  return <div className="space-y-3 rounded border border-white/20 p-3">
    <div className="flex flex-wrap gap-3"><strong>Private rendered preview</strong><button onClick={onClose}>Close preview</button>
      <select className="rounded bg-[#151515] text-white" aria-label="Preview width" value={width} onChange={e => setWidth(e.target.value)}><option value="100%">Available width</option><option value="1440px">Desktop (1440px)</option><option value="390px">Mobile</option></select>
      <select className="rounded bg-[#151515] text-white" aria-label="Preview page" value={page} onChange={e => setPage(e.target.value)}><option value="home">Home</option><option value="contact">Contact</option></select></div>
    <p className="text-xs text-gray-400">Snapshot only. Links, forms, tracking and external images are disabled. Remote images appear blank.</p>
    {error && <p role="alert">{error}</p>}
    {payload ? <><p className="text-xs">{payload.sections.map(s => `${s.id}: ${s.unsaved ? 'unsaved edits' : s.draft ? 'saved draft' : 'published'}`).join(' · ')}</p>
      <div className="max-w-full overflow-x-auto"><iframe ref={frame} title="Private content preview" src={PREVIEW_PATH} sandbox="allow-scripts allow-same-origin" referrerPolicy="no-referrer" style={{ width, height: '760px', background: '#090909' }} /></div>
    </> : !error && <p>Loading private snapshot…</p>}
  </div>;
}
