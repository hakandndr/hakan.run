// The canonical Boss sections.
//
// This list is the frontend half of a contract the Worker already enforces:
// `worker/boss/index.js` exports the same six module names and serves no other.
// Decision D-012 fixes the set, and D-019 makes `/boss/*` the only private
// surface — there is no `/control-room` in the target and none is defined here.
//
// Paths are declared once, so navigation, route registration and active-state
// detection cannot drift apart.

export const BOSS_BASE = '/boss';

export const BOSS_SECTIONS = [
  {
    id: 'dashboard',
    path: '/boss',
    label: 'Dashboard',
    command: 'status',
    summary: 'Operational state at a glance',
  },
  {
    id: 'analytics',
    path: '/boss/analytics',
    label: 'Analytics',
    command: 'analytics',
    summary: 'First-party PAGE events and coverage',
  },
  {
    id: 'content',
    path: '/boss/content',
    label: 'Content',
    command: 'content',
    summary: 'Published sections and revisions',
  },
  {
    id: 'submissions',
    path: '/boss/submissions',
    label: 'Submissions',
    command: 'submissions',
    summary: 'Durable contact records and notification state',
  },
  {
    id: 'audit',
    path: '/boss/audit',
    label: 'Audit',
    command: 'audit',
    summary: 'Privileged actions, newest first',
  },
  {
    id: 'system',
    path: '/boss/system',
    label: 'System',
    command: 'system',
    summary: 'Bindings, retention policy and environment',
  },
];

/** Trailing slashes are equivalent; `/boss/` is the Dashboard, not a new route. */
export const normalizeBossPath = (pathname) => {
  const path = String(pathname ?? '').split('?')[0].split('#')[0];
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path;
};

export const isBossPath = (pathname) => {
  const path = normalizeBossPath(pathname);
  return path === BOSS_BASE || path.startsWith(`${BOSS_BASE}/`);
};

/** The section a path belongs to, or null when it is not a Boss section. */
export const sectionForPath = (pathname) => {
  const path = normalizeBossPath(pathname);
  return BOSS_SECTIONS.find((section) => section.path === path) ?? null;
};

export const bossSectionIds = () => BOSS_SECTIONS.map((section) => section.id);
