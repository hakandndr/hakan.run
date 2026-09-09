import React, { useEffect, useState } from 'react';
import ContentFields from '../components/ContentFields.jsx';
import PrivatePreview from '../components/PrivatePreview.jsx';
import { validateSection, SECTION_SCHEMAS } from '../../content-source/schema.js';
import { fetchBoss, mutateBoss } from '../api.js';
import { useBossResource } from '../useBossResource.js';
import { LoadingState, ErrorState, EmptyState } from '../components/StateBlock.jsx';
import { Panel, DataTable } from '../components/Panel.jsx';

const instant = (value) =>
  value ? new Date(Number(value)).toISOString().replace('T', ' ').slice(0, 16) : '—';
const pretty = (value) => JSON.stringify(value, null, 2);
const button = 'rounded border border-white/15 px-3 py-2 text-xs font-mono hover:border-[#57B8FF]/50 disabled:opacity-40';
const title = 'font-mono text-sm font-semibold text-white';

const Content = () => {
  const list = useBossResource('/api/boss/content');
  const [selected, setSelected] = useState('');
  const [showSections, setShowSections] = useState(false);
  const [record, setRecord] = useState(null);
  const [text, setText] = useState('');
  const [detailState, setDetailState] = useState('idle');
  const [revisions, setRevisions] = useState([]);
  const [history, setHistory] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [advanced, setAdvanced] = useState(false);
  let editorData = null;
  try { editorData = JSON.parse(text); } catch {}
  const fieldErrors = editorData ? validateSection(selected, editorData) : [];
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

  useEffect(() => {
    const warn = e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const open = (section) => {
    if (busy || section === selected) return;
    if (dirty && !window.confirm('Discard unsaved editor changes and open another section?')) return;
    setRecord(null);
    setText('');
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
    try { const data = parsed(); const issues = validateSection(selected, data); if (issues.length) throw new Error(issues.map(e => `${e.path}: ${e.message}`).join('; ')); await perform('draft', { data }, 'PUT', 'draft'); }
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

  const priority = Object.keys(SECTION_SCHEMAS);
  const sections = [...(list.data?.sections ?? [])].sort((a,b) => priority.indexOf(a.section) - priority.indexOf(b.section));
  return (
    <div className="space-y-5">
      <Panel title="Content sections" hint="APP_DB is the content authority for this environment">
        {sections.length > 0 && <div className="flex flex-wrap gap-3 mb-3"><label>Section <select aria-label="Content section" disabled={busy} className="rounded bg-[#151515] px-3 py-2 text-white" value={selected} onChange={e => open(e.target.value)}><option value="" disabled>Choose a section</option>{sections.map(s => <option key={s.section} value={s.section}>{SECTION_SCHEMAS[s.section]?.label ?? s.section}</option>)}</select></label>{selected && <button className={button} onClick={() => setShowSections(!showSections)}>{showSections ? 'Hide section overview' : 'Show section overview'}</button>}</div>}
        {(!selected || showSections) && (sections.length === 0 ? <EmptyState message="No published content sections." /> : (
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
        ))}
      </Panel>
      {selected && (
        <Panel title={`Edit ${selected}`} hint="Staging field editor — changes are not public until Publish">
          {detailState === 'loading' ? <LoadingState label="reading section" /> : (
            <div className="space-y-4">
              {error && <div role="alert" className="rounded border border-red-500/30 p-3 text-sm text-red-300">{error}</div>}
              {notice && <div role="status" className="rounded border border-green-500/30 p-3 text-sm text-green-300">{notice}</div>}
              {record?.section === selected && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
                    <span>Published revision: {record.publishedRevision ?? '—'} · Version: {record.updatedAt}</span>
                    <span>{record.draft ? 'Saved draft exists' : 'No saved draft'}{dirty ? ' · Unsaved edits' : ''}</span>
                  </div>
                  <button disabled={busy} className={button} onClick={() => setAdvanced(!advanced)}>{advanced ? 'Field editor' : 'Advanced JSON'}</button>
                  {['colors','typography'].includes(selected) && <p className="text-xs text-gray-400">These controls affect existing theme variables and typography settings. Fixed component styling remains part of the public design.</p>}
                  {!advanced && editorData && <ContentFields section={selected} data={editorData} errors={fieldErrors} disabled={busy} onChange={data => { setText(pretty(data)); setPreviewData(null); }} />}
                  {!advanced && !editorData && <p role="alert">Invalid JSON. Open Advanced JSON to repair it.</p>}
                  {advanced && <label className="block space-y-2">
                    <span className={title}>Section JSON</span>
                    <textarea
                      className="w-full min-h-[320px] rounded border border-white/15 bg-black/20 p-3 font-mono text-xs text-gray-200 focus:border-[#57B8FF] focus:outline-none"
                      disabled={busy} spellCheck={false} value={text} onChange={(event) => { setText(event.target.value); setPreviewData(null); }}
                    />
                  </label>}
                  <div className="flex flex-wrap gap-2">
                    <button className={button} disabled={busy} onClick={() => {
                      try { const issues = validateSection(selected, parsed()); if (issues.length) throw new Error(issues.map(e => `${e.path}: ${e.message}`).join('; ')); setError(''); setNotice('Content fields are valid.'); }
                      catch (err) { setError(err.message); }
                    }}>Validate content</button>
                    <button className={button} disabled={busy} onClick={() => {
                      try { const value = parsed(); const issues = validateSection(selected, value); if (issues.length) throw new Error('Resolve field validation errors before previewing.'); setError(''); setPreviewData({ section: selected, data: value, unsaved: !!dirty, expected }); }
                      catch (err) { setError(err.message); }
                    }}>Preview current edits</button>
                    <button className={button} disabled={busy} onClick={() => setPreviewData({ section: selected })}>Preview saved drafts</button>
                    <button className={button} disabled={busy || !dirty || fieldErrors.length > 0 || !editorData} onClick={save}>Save draft</button>
                    <button className={button} disabled={busy} onClick={refresh}>Reload</button>
                  </div>
                  {previewData && <PrivatePreview request={previewData} onClose={() => setPreviewData(null)} />}
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
