import { validateSection, SECTION_SCHEMAS } from '../content-source/schema.js';
export const PREVIEW_PATH = '/boss/content/preview';
export function composePreview(snapshot, request) {
  const sections = structuredClone(snapshot.sections);
  if (!Array.isArray(sections) || sections.length !== Object.keys(SECTION_SCHEMAS).length || new Set(sections.map(s => s.id)).size !== sections.length) throw new Error('Private preview snapshot is incomplete.');
  if (request.data) {
    const row = sections.find(s => s.id === request.section);
    if (!row || row.updatedAt !== request.expected.expectedVersion || row.revision !== request.expected.expectedRevision) throw new Error('Content conflict: reload and reconcile before previewing current edits. Your editor is preserved.');
    row.data = structuredClone(request.data);
    row.unsaved = request.unsaved;
  }
  for (const row of sections) if (validateSection(row.id,row.data).length) throw new Error(`Invalid preview section: ${row.id}`);
  return { sections };
}
export function acceptPreview(event, parent, origin) {
  return event.source === parent && event.origin === origin && event.data?.type === 'cms-preview' && Array.isArray(event.data?.payload?.sections);
}
// Preview never requests a user-supplied remote image, API path or query string.
export function previewImages(value) {
  if (Array.isArray(value)) return value.map(previewImages);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,
    ['image','imgSrc'].includes(k) && typeof v === 'string'
      ? (/^\/(media|portfolio)\/[a-zA-Z0-9_./-]+\.(webp|png|jpg|jpeg|gif|svg)$/i.test(v) && !v.includes('..') ? v : undefined)
      : previewImages(v)]));
  return value;
}
