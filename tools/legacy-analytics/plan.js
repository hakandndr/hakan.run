// Offline full-log reconciliation. Never map a tail as an independent export.
import { parseExport } from './parse.js';
import { mapExport, summarize } from './map.js';
import { describeSnapshot, fingerprintOf, verifyPrefix } from './snapshot.js';

export const planLegacyExport = ({ bytes, previous, initial = false, fileName, capturedAt = Date.now() }) => {
  if ((initial && previous != null) || (!initial && previous == null))
    throw new Error('Choose --initial for a verified empty legacy target or supply --previous-snapshot');
  const prefix = initial ? Buffer.alloc(0) : verifyPrefix(bytes, previous);
  const decode = (value) => new TextDecoder('utf-8', { fatal: true }).decode(value);
  const oldMapped = mapExport(parseExport(decode(prefix)), capturedAt);
  const mapped = mapExport(parseExport(decode(bytes)), capturedAt);
  if (!mapped.length) throw new Error('Full log contains no source records');
  const oldSummary = summarize(oldMapped);
  if (previous) {
    for (const [field, actual] of Object.entries({ sourceRecords: oldSummary.sourceRecords,
      importedEvents: oldSummary.imported, archivedRecords: oldSummary.archived })) {
      if (!Number.isSafeInteger(previous[field]) || previous[field] !== actual)
        throw new Error(`Previous snapshot ${field} does not match its verified source bytes`);
    }
  }
  // Keep existing IDs, line ordinals, duplicate ordinals and mapping semantics.
  for (let i = 0; i < oldMapped.length; i++) {
    const old = oldMapped[i], next = mapped[i];
    if (!next || old.id !== next.id || old.eventId !== next.eventId || old.sourceRecord !== next.sourceRecord)
      throw new Error('Existing source record identity changed at the append boundary');
  }
  const summary = summarize(mapped);
  const snapshot = describeSnapshot({ contents: bytes, fileName, mapped, capturedAt });
  const totals = (s) => ({ sourceRecords: s.sourceRecords, importableEvents: s.imported,
    archivedOnly: s.archived, archiveRows: s.sourceRecords });
  const oldTotals = totals(oldSummary), fullTotals = totals(summary);
  const delta = Object.fromEntries(Object.keys(fullTotals).map(k => [k, fullTotals[k] - oldTotals[k]]));
  if (Object.values(delta).some(n => n < 0)) throw new Error('Source totals decreased');
  return { mapped, snapshot, summary, reconciliation: { mode: initial ? 'initial' : 'verified-prefix',
    previous: { ...fingerprintOf(prefix), ...oldTotals },
    full: { ...fingerprintOf(bytes), ...fullTotals }, delta } };
};
