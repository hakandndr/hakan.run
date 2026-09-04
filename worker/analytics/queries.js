// Production analytics query builders.
//
// Every builder returns `{ sql, params }` and nothing else: no database handle,
// no environment. The Worker binds them to D1; the tests bind them to SQLite.
// There is exactly one definition of each query, so a query-plan test cannot
// pass against SQL that production never emits.

export const AGGREGATE_VERSION = 1;

const HUMAN_ACTORS = "actor_class NOT IN ('verified-bot','automated-likely')";
const AUTOMATED_ACTORS = "actor_class IN ('verified-bot','automated-likely')";

// ---------------------------------------------------------------------------
// Filters
//
// Selective predicates are exact or prefix so they stay sargable. No filter
// uses leading-wildcard matching: `LIKE '%x%'` cannot use an index and its cost
// grows with the whole table.
// ---------------------------------------------------------------------------

const escapePrefix = (value) => value.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * Build the WHERE fragment for an event query.
 * `range` is a half-open `[start, end)` instant window, or null for unbounded.
 */
export const buildEventFilter = (filters = {}, range = null) => {
  const conditions = [];
  const params = [];

  if (range) {
    conditions.push('occurred_at >= ?', 'occurred_at < ?');
    params.push(range.start, range.end);
  }
  if (filters.actor === 'human') conditions.push(HUMAN_ACTORS);
  else if (filters.actor === 'automated') conditions.push(AUTOMATED_ACTORS);
  else if (filters.actorClass) {
    conditions.push('actor_class = ?');
    params.push(filters.actorClass);
  }
  if (filters.country) {
    conditions.push('country = ?');
    params.push(filters.country.toUpperCase());
  }
  if (filters.browser) {
    conditions.push('browser_family = ?');
    params.push(filters.browser);
  }
  if (filters.path) {
    if (filters.pathExact) {
      conditions.push('path = ?');
      params.push(filters.path);
    } else {
      conditions.push("path LIKE ? ESCAPE '\\'");
      params.push(`${escapePrefix(filters.path)}%`);
    }
  }
  if (filters.ip) {
    if (filters.ipExact) {
      conditions.push('ip_address = ?');
      params.push(filters.ip);
    } else {
      conditions.push("ip_address LIKE ? ESCAPE '\\'");
      params.push(`${escapePrefix(filters.ip)}%`);
    }
  }
  if (filters.city) {
    conditions.push("city LIKE ? ESCAPE '\\'");
    params.push(`${escapePrefix(filters.city)}%`);
  }
  if (filters.referrer) {
    conditions.push("referrer_origin LIKE ? ESCAPE '\\'");
    params.push(`${escapePrefix(filters.referrer)}%`);
  }

  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
};

// ---------------------------------------------------------------------------
// Coverage ledger
// ---------------------------------------------------------------------------

/** The only query that may establish trusted aggregate coverage. */
export const coveredDaysQuery = (from, to, version = AGGREGATE_VERSION) => ({
  sql: `SELECT date_local AS day FROM analytics_coverage
        WHERE aggregate_version = ? AND date_local >= ? AND date_local <= ?
        ORDER BY date_local`,
  params: [version, from, to],
});

// ---------------------------------------------------------------------------
// Totals, split by actor class
// ---------------------------------------------------------------------------

export const rawTotalsQuery = (range, filters = {}) => {
  const { where, params } = buildEventFilter(filters, range);
  return {
    sql: `SELECT COUNT(*) AS events,
                 COALESCE(SUM(CASE WHEN ${HUMAN_ACTORS} THEN 1 ELSE 0 END), 0) AS human,
                 COALESCE(SUM(CASE WHEN ${AUTOMATED_ACTORS} THEN 1 ELSE 0 END), 0) AS automated
          FROM visitor_events ${where}`,
    params,
  };
};

export const aggregateTotalsQuery = (days, version = AGGREGATE_VERSION) => {
  if (days.length === 0) return null;
  const slots = days.map(() => '?').join(', ');
  return {
    sql: `SELECT COALESCE(SUM(event_count), 0) AS events,
                 COALESCE(SUM(CASE WHEN ${HUMAN_ACTORS} THEN event_count ELSE 0 END), 0) AS human,
                 COALESCE(SUM(CASE WHEN ${AUTOMATED_ACTORS} THEN event_count ELSE 0 END), 0) AS automated
          FROM analytics_daily
          WHERE aggregate_version = ? AND date_local IN (${slots})`,
    params: [version, ...days],
  };
};

// ---------------------------------------------------------------------------
// Labelled breakdowns
//
// Neither side truncates. Truncation happens after the merge, in coverage.js,
// because a label ranked outside the top N in each source separately can still
// rank inside the top N overall.
// ---------------------------------------------------------------------------

export const rawTopPagesQuery = (range, filters = {}) => {
  const { where, params } = buildEventFilter(filters, range);
  return {
    sql: `SELECT path AS label, COUNT(*) AS value FROM visitor_events ${where}
          GROUP BY path`,
    params,
  };
};

export const aggregateTopPagesQuery = (days, version = AGGREGATE_VERSION) => {
  if (days.length === 0) return null;
  const slots = days.map(() => '?').join(', ');
  return {
    sql: `SELECT path AS label, SUM(event_count) AS value FROM analytics_daily
          WHERE aggregate_version = ? AND date_local IN (${slots})
          GROUP BY path`,
    params: [version, ...days],
  };
};

export const rawCountriesQuery = (range, filters = {}) => {
  const { where, params } = buildEventFilter(filters, range);
  return {
    sql: `SELECT COALESCE(country, '') AS label, COUNT(*) AS value
          FROM visitor_events ${where} GROUP BY COALESCE(country, '')`,
    params,
  };
};

export const aggregateCountriesQuery = (days, version = AGGREGATE_VERSION) => {
  if (days.length === 0) return null;
  const slots = days.map(() => '?').join(', ');
  return {
    sql: `SELECT country AS label, SUM(event_count) AS value FROM analytics_daily
          WHERE aggregate_version = ? AND date_local IN (${slots})
          GROUP BY country`,
    params: [version, ...days],
  };
};

// ---------------------------------------------------------------------------
// Daily series
// ---------------------------------------------------------------------------

export const rawDailySeriesQuery = (range, filters = {}) => {
  const { where, params } = buildEventFilter(filters, range);
  return {
    sql: `SELECT date_local AS label, COUNT(*) AS value FROM visitor_events ${where}
          GROUP BY date_local`,
    params,
  };
};

export const aggregateDailySeriesQuery = (days, version = AGGREGATE_VERSION) => {
  if (days.length === 0) return null;
  const slots = days.map(() => '?').join(', ');
  return {
    sql: `SELECT date_local AS label, SUM(event_count) AS value FROM analytics_daily
          WHERE aggregate_version = ? AND date_local IN (${slots})
          GROUP BY date_local`,
    params: [version, ...days],
  };
};

// ---------------------------------------------------------------------------
// Unique addresses
//
// Exact and therefore raw-only: distinct counts are not additive across days,
// so a daily aggregate cannot answer this without being wrong. Cost grows with
// retained volume; recorded as a known future cost rather than approximated.
// ---------------------------------------------------------------------------

export const uniqueAddressesQuery = (range, filters = {}) => {
  const { where, params } = buildEventFilter(filters, range);
  return {
    sql: `SELECT COUNT(DISTINCT ip_address) AS value FROM visitor_events ${where}`,
    params,
  };
};

// ---------------------------------------------------------------------------
// Raw event stream
// ---------------------------------------------------------------------------

export const eventStreamQuery = (filters, limit, offset, range = null) => {
  const { where, params } = buildEventFilter(filters, range);
  return {
    sql: `SELECT id, occurred_at, date_local, ip_address, country, region, city, colo,
                 path, referrer_origin, user_agent, browser_family, device_class,
                 actor_class, classification_source, session_id, request_id
          FROM visitor_events ${where}
          ORDER BY occurred_at DESC, id DESC
          LIMIT ? OFFSET ?`,
    params: [...params, limit, offset],
  };
};

/**
 * Total for a filter set. Run when the filter set changes, not on every page
 * change: the client retains the known total while paging.
 */
export const eventCountQuery = (filters, range = null) => {
  const { where, params } = buildEventFilter(filters, range);
  return { sql: `SELECT COUNT(*) AS value FROM visitor_events ${where}`, params };
};

// ---------------------------------------------------------------------------
// TODAY ordinal
//
// The ordinal of an event within its own local day, counting from the first
// visit of that day. One query per distinct local day on the page, each bounded
// to that day through the local-day index.
//
// The window function here is deliberate and is not the pattern the reference
// audit rejected: that one ranked the entire table with no predicate. This one
// ranks a single indexed local day and returns only the rows on the page.
// ---------------------------------------------------------------------------

export const dayOrdinalsQuery = (day, ids) => {
  if (ids.length === 0) return null;
  const slots = ids.map(() => '?').join(', ');
  return {
    sql: `WITH numbered AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY occurred_at ASC, id ASC) AS ordinal
            FROM visitor_events WHERE date_local = ?
          )
          SELECT id, ordinal FROM numbered WHERE id IN (${slots})`,
    params: [day, ...ids],
  };
};

// ---------------------------------------------------------------------------
// System and retention visibility
// ---------------------------------------------------------------------------

/**
 * Oldest retained raw event, for the System retention panel.
 *
 * Expressed as an ordered single-row read rather than `MIN(...)` alongside a
 * count: combining the two makes the planner scan a covering index, while this
 * form is an index seek and stays O(1) as retention grows.
 */
export const oldestEventQuery = () => ({
  sql: `SELECT occurred_at AS oldest, date_local AS oldest_day FROM visitor_events
        ORDER BY occurred_at ASC LIMIT 1`,
  params: [],
});

/**
 * Total retained raw events. This is a full count and therefore scans; it is a
 * System-panel figure read on demand, not part of any hot path.
 */
export const totalEventsQuery = () => ({
  sql: `SELECT COUNT(*) AS value FROM visitor_events`,
  params: [],
});

/** Preview of an operator deletion. Never deletes. */
export const deletePreviewQuery = (cutoff) => ({
  sql: `SELECT COUNT(*) AS value, MIN(occurred_at) AS oldest, MAX(occurred_at) AS newest
        FROM visitor_events WHERE occurred_at < ?`,
  params: [cutoff],
});

/** The confirmed deletion itself. Only ever reached after preview + confirm. */
export const deleteEventsQuery = (cutoff) => ({
  sql: `DELETE FROM visitor_events WHERE occurred_at < ?`,
  params: [cutoff],
});
