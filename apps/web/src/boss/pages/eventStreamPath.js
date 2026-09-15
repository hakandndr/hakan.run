// The request path for one view of the raw event stream.
//
// Plain module rather than a helper inside the page, because this is the whole
// client half of the /api/boss/analytics/events contract — which filters are
// sent, under which names, and when the retained total may be reused — and it
// is worth executing in a test rather than reading in one.

export const STREAM_FILTER_KEYS = [
  'ip', 'country', 'city', 'path', 'referrer', 'browser', 'actor', 'source', 'from', 'to',
];

export const PAGE_SIZES = [25, 50, 100];

/** Newest-first page labels expose the canonical record ordinals in each page. */
export const buildPageOptions = (total, limit) => {
  const safeTotal = Math.max(0, Number(total) || 0);
  const safeLimit = PAGE_SIZES.includes(Number(limit)) ? Number(limit) : PAGE_SIZES[0];
  const pages = Math.max(1, Math.ceil(safeTotal / safeLimit));
  return Array.from({ length: pages }, (_, index) => {
    const value = index + 1;
    const newest = Math.max(0, safeTotal - index * safeLimit);
    const oldest = safeTotal === 0 ? 0 : Math.max(1, newest - safeLimit + 1);
    return { value, label: `page ${value} · ${newest}–${oldest}` };
  });
};

export const EMPTY_FILTERS = Object.freeze(
  Object.fromEntries(STREAM_FILTER_KEYS.map((key) => [key, ''])),
);

/**
 * `knownTotal` is sent only past the first page. Omitting it asks the Worker
 * for a fresh count, which is exactly what a changed filter set needs; sending
 * it back while paging is what makes a page change cost one query, not two.
 * A blank filter is omitted rather than sent empty, so an untouched field
 * cannot narrow the query to nothing.
 */
export const buildEventsPath = (filters, limit, page, knownTotal) => {
  const params = new URLSearchParams();
  for (const key of STREAM_FILTER_KEYS) {
    const value = String(filters?.[key] ?? '').trim();
    if (value) params.set(key, value);
  }
  params.set('limit', String(PAGE_SIZES.includes(Number(limit)) ? Number(limit) : PAGE_SIZES[0]));
  params.set('page', String(Math.max(1, Number(page) || 1)));
  if (Number(page) > 1 && Number.isSafeInteger(knownTotal) && knownTotal >= 0) {
    params.set('knownTotal', String(knownTotal));
  }
  return `/api/boss/analytics/events?${params.toString()}`;
};
