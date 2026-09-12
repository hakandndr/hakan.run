// Offline full-log reconciliation. Never map a tail as an independent export.
import { parseExport } from './parse.js';
import { mapExport, summarize } from './map.js';
import { describeSnapshot, fingerprintOf, verifyPrefix } from './snapshot.js';
import { currentClassification, validateClassification } from './classification.js';

export const planLegacyExport = ({ bytes, previous, initial = false, fileName, capturedAt = Date.now() }) => {
  if ((initial && previous != null) || (!initial && previous == null))
    throw new Error('Choose --initial for a verified empty legacy target or supply --previous-snapshot');
  const prefix = initial ? Buffer.alloc(0) : verifyPrefix(bytes, previous);
  const decode = (value) => new TextDecoder('utf-8', { fatal: true }).decode(value);
  // Older evidence remains readable by falling back to the then-current
  // behavior. New evidence records its classification contract explicitly.
  const historicalClassification = previous?.classification == null
    ? currentClassification()
    : validateClassification(previous.classification);
  const oldMapped = mapExport(parseExport(decode(prefix)), capturedAt, historicalClassification);
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
  // Source identity never depends on route policy. An event identity is checked
  // when both policies import the record; a legitimate route-policy transition
  // may add or remove the event side without changing the source row.
  for (let i = 0; i < oldMapped.length; i++) {
    const old = oldMapped[i], next = mapped[i];
    if (!next || old.id !== next.id || old.sourceLine !== next.sourceLine
      || old.sourceRecord !== next.sourceRecord
      || (old.eventId && next.eventId && old.eventId !== next.eventId))
      throw new Error('Existing source record identity changed at the append boundary');
  }
  const summary = summarize(mapped);
  const currentPrefixSummary = summarize(mapped.slice(0, oldMapped.length));
  const appendedSummary = summarize(mapped.slice(oldMapped.length));
  const snapshot = describeSnapshot({ contents: bytes, fileName, mapped, capturedAt });
  const totals = (s) => ({ sourceRecords: s.sourceRecords, importableEvents: s.imported,
    archivedOnly: s.archived, archiveRows: s.sourceRecords });
  const oldTotals = totals(oldSummary), fullTotals = totals(summary), delta = totals(appendedSummary);
  const currentPrefixTotals = totals(currentPrefixSummary);
  const historicalSemanticDrift = Object.fromEntries(Object.keys(fullTotals)
    .map(k => [k, currentPrefixTotals[k] - oldTotals[k]]));
  return { mapped, snapshot, summary, reconciliation: { mode: initial ? 'initial' : 'verified-prefix',
    previous: { ...fingerprintOf(prefix), ...oldTotals },
    full: { ...fingerprintOf(bytes), ...fullTotals }, delta, historicalSemanticDrift } };
};
