import React, { useEffect, useState } from 'react';
import { fetchBoss, mutateBoss } from '../api.js';
import { useBossResource } from '../useBossResource.js';
import { LoadingState, ErrorState, EmptyState } from '../components/StateBlock.jsx';
import { Panel, DataTable } from '../components/Panel.jsx';

const instant = (value) =>
  value ? new Date(Number(value)).toISOString().replace('T', ' ').slice(0, 16) : '—';
const pretty = (value) => JSON.stringify(value, null, 2);
const empty = { section: '', draft: null, published: null, publishedRevision: null, updatedAt: 0 };
const button = 'rounded border border-white/15 px-3 py-2 text-xs font-mono hover:border-[#57B8FF]/50 disabled:opacity-40';
const title = 'font-mono text-sm font-semibold text-white';

const Preview = ({ data }) => (
  <div className="space-y-3">
    <p className="text-xs text-gray-400">Structured content preview. This is not a rendered public-page preview.</p>
    {Object.entries(data).map(([key, value]) => (
      <div key={key} className="rounded border border-white/10 p-3">
        <div className="font-mono text-xs text-[#57B8FF] mb-1">{key}</div>
        {typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
          ? <p className="text-sm whitespace-pre-wrap break-words">{String(value)}</p>
          : <pre className="text-xs whitespace-pre-wrap break-words text-gray-400">{pretty(value)}</pre>}
      </div>
    ))}
  </div>
);

const Content = () => {
  const list = useBossResource('/api/boss/content');
  const [selected, setSelected] = useState('');
  const [record, setRecord] = useState(null);
  const [text, setText] = useState('');
  const [detailState, setDetailState] = useState('idle');
  const [revisions, setRevisions] = useState([]);
  const [history, setHistory] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState('');
  const [editorKey, setEditorKey] = useState(0);

  const dirty = record && text !== pretty(record.draft ?? record.published ?? {});
  const sectionPath = selected ? `/api/boss/content/${encodeURIComponent(selected)}` : '';
  const expected = record ? {
    expectedVersion: record.updatedAt,
    expectedRevision: record.publishedRevision ?? 0,
  } : null;

  useEffect(() => {
    if (!selected) return undefined;
    const controller = new AbortController();
    setDetailState('loading');
    setRecord(null);
    setText('');
    setRevisions([]);
    setHistory(null);
    setError('');
    setNotice('');
    setConfirm('');
    setPreviewData(null);
    fetchBoss(`/api/boss/content/${selected}`, { signal: controller.signal })
      .then((row) => {
        setRecord(row);
        setText(pretty(row.draft ?? row.published ?? {}));
        setDetailState('ready');
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setDetailState('error');
        }
      });
    return () => controller.abort();
  }, [selected, editorKey]);

  const open = (section) => {
    if (section === selected) return;
    if (dirty && !window.confirm('Discard unsaved editor changes and open another section?')) return;
    setSelected(section);
  };
  const refresh = () => {
    if (dirty && !window.confirm('Discard unsaved editor changes and reload from APP_DB?')) return;
    setEditorKey((value) => value + 1);
    list.reload();
  };
  const parsed = () => {
    const value = JSON.parse(text);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('A section must be a JSON object.');
    return value;
  };
  const perform = async (operation, payload, method = 'POST', suffix = operation) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const next = await mutateBoss(`${sectionPath}/${suffix}`, { method, body: { ...expected, ...payload } });
      setRecord(next);
      setText(pretty(next.draft ?? next.published ?? {}));
      setConfirm('');
      setPreviewData(null);
      setHistory(null);
      setNotice(`${operation} completed.`);
      list.reload();
      // A publication or restore changes the revision list.
      setRevisions([]);
    } catch (err) {
      setError(err.status === 409
        ? 'Content conflict: another change was saved. Your editor text is preserved. Copy it before reloading and reconcile the changes.'
        : err.message);
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    try { await perform('draft', { data: parsed() }, 'PUT', 'draft'); }
    catch (err) { setError(err.message); }
  };
  const loadHistory = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await fetchBoss(`${sectionPath}/revisions`);
      setRevisions(result.revisions ?? []);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const viewRevision = async (revision) => {
    setBusy(true);
    setError('');
    try {
      setHistory(await fetchBoss(`${sectionPath}/revisions/${revision}`));
      setConfirm('');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  if (list.status === 'loading') return <LoadingState label="reading /api/boss/content" />;
  if (list.status === 'error') return <ErrorState error={list.error} onRetry={list.reload} />;

  const sections = list.data?.sections ?? [];
  return (
    <div className="space-y-5">
      <Panel title="Content sections" hint="APP_DB is the content authority for this environment">
        {sections.length === 0 ? <EmptyState message="No published content sections." /> : (
          <DataTable
            columns={[
              { key: 'section', label: 'Section', render: (row) => (
                <button className="text-[#57B8FF] font-mono text-xs hover:underline" onClick={() => open(row.section)}>{row.section}</button>
              ) },
              { key: 'published_revision', label: 'Revision', render: (row) => row.published_revision ?? '—' },
              { key: 'published_at', label: 'Published', render: (row) => instant(row.published_at) },
              { key: 'draft_updated_at', label: 'Draft updated', render: (row) => instant(row.draft_updated_at) },
            ]}
            rows={sections}
            rowKey={(row) => row.section}
          />
        )}
      </Panel>
      {selected && (
        <Panel title={`Edit ${selected}`} hint="Staging JSON editor — changes are not public until Publish">
          {detailState === 'loading' ? <LoadingState label="reading section" /> : (
            <div className="space-y-4">
              {error && <div role="alert" className="rounded border border-red-500/30 p-3 text-sm text-red-300">{error}</div>}
              {notice && <div role="status" className="rounded border border-green-500/30 p-3 text-sm text-green-300">{notice}</div>}
              {record && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
                    <span>Published revision: {record.publishedRevision ?? '—'} · Version: {record.updatedAt}</span>
                    <span>{record.draft ? 'Saved draft exists' : 'No saved draft'}{dirty ? ' · Unsaved edits' : ''}</span>
                  </div>
                  <label className="block space-y-2">
                    <span className={title}>Section JSON</span>
                    <textarea
                      className="w-full min-h-[320px] rounded border border-white/15 bg-black/20 p-3 font-mono text-xs text-gray-200 focus:border-[#57B8FF] focus:outline-none"
                      spellCheck={false} value={text} onChange={(event) => { setText(event.target.value); setPreviewData(null); }}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button className={button} disabled={busy} onClick={() => {
                      try { parsed(); setError(''); setNotice('JSON syntax is valid. Server validation runs when saving.'); }
                      catch (err) { setError(err.message); }
                    }}>Validate JSON</button>
                    <button className={button} disabled={busy} onClick={() => {
                      try { const value = parsed(); setError(''); setPreviewData(value); }
                      catch (err) { setError(err.message); }
                    }}>Preview values</button>
                    <button className={button} disabled={busy || !dirty} onClick={save}>Save draft</button>
                    <button className={button} disabled={busy} onClick={refresh}>Reload</button>
                  </div>
                  {previewData && (
                    <div className="rounded border border-white/10 p-4 space-y-3">
                      <div className="flex justify-between gap-2">
                        <span className={title}>Unsaved editor preview</span>
                        <button className={button} onClick={() => setPreviewData(null)}>Close</button>
                      </div>
                      <Preview data={previewData} />
                    </div>
                  )}
                  <div className="border-t border-white/10 pt-4 space-y-3">
                    <h3 className={title}>Publication</h3>
                    <p className="text-xs text-gray-400">Save the draft first. Publishing creates a new immutable revision and makes the saved draft public.</p>
                    <input className="w-full rounded border border-white/15 bg-black/20 px-3 py-2 text-sm" placeholder="Optional revision note"
                      value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} />
                    <div className="flex flex-wrap gap-2">
                      <button className={button} disabled={busy || dirty || !record.draft} onClick={() => setConfirm('publish')}>Publish saved draft</button>
                      <button className={button} disabled={busy || dirty || !record.draft} onClick={() => setConfirm('discard')}>Discard saved draft</button>
                    </div>
                    {(confirm === 'publish' || confirm === 'discard') && (
                      <div className="rounded border border-white/15 p-3 space-y-2">
                        <p className="text-sm">Confirm {confirm} for {selected}?</p>
                        <div className="flex gap-2">
                          <button className={button} disabled={busy} onClick={() => perform(confirm, confirm === 'publish' ? { note } : {}, confirm === 'publish' ? 'POST' : 'DELETE', confirm === 'publish' ? 'publish' : 'draft')}>Confirm</button>
                          <button className={button} onClick={() => setConfirm('')}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-white/10 pt-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={title}>Revision history</h3>
                      <button className={button} disabled={busy} onClick={loadHistory}>Load history</button>
                    </div>
                    {revisions.map((item) => (
                      <div key={item.revision} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 py-2 text-xs">
                        <span>Revision {item.revision} · {instant(item.created_at)} · {item.actor}</span>
                        <button className={button} disabled={busy} onClick={() => viewRevision(item.revision)}>View</button>
                      </div>
                    ))}
                    {history && (
                      <div className="space-y-3 rounded border border-white/10 p-3">
                        <h4 className={title}>Revision {history.revision}</h4>
                        <p className="text-xs text-gray-400">{history.note || 'No note'}</p>
                        <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-words font-mono text-xs">{pretty(history.data)}</pre>
                        <button className={button} disabled={busy || dirty || !!record.draft} onClick={() => setConfirm(`restore:${history.revision}`)}>Restore as new revision</button>
                        {confirm === `restore:${history.revision}` && (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-400">Restore will publish this historical content as a new revision. Existing history is retained.</p>
                            <div className="flex gap-2">
                              <button className={button} disabled={busy} onClick={() => perform('restore', {}, 'POST', `revisions/${history.revision}`)}>Confirm restore</button>
                              <button className={button} onClick={() => setConfirm('')}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
};

export default Content;
