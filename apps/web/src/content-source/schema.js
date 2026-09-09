// Shared CMS field contracts. Unknown JSON fields are retained, never projected away.
const text = (label, extra = {}) => ({ type: 'string', label, max: 6000, ...extra });
const area = (label, extra = {}) => text(label, { multiline: true, max: 60000, ...extra });
const optional = (field) => ({ ...field, optional: true });
const url = (label, kind = 'link') => optional(text(label, { format: kind, max: 2048 }));
const object = (label, fields, extra = {}) => ({ type: 'object', label, fields, ...extra });
const list = (label, item) => ({ type: 'array', label, item, max: 1000 });
const bool = (label) => ({ type: 'boolean', label });
// Navigation consumers require href to be present, even when other URLs are optional.
const link = object('Link', { name: text('Label'), href: { ...url('Destination'), optional: false } });
const social = object('Social link', { name: text('Name'), url: url('URL', 'external') });
const story = object('Story', { title: text('Title'), body: area('Body') });
const block = (label) => object(label, {
  heading: text('Heading'), headingAccent: text('Highlighted heading'),
  image: url('Image reference', 'image'), imageAlt: text('Image description'),
  sections: list('Stories', story), visible: optional(bool('Visible')),
});
export const INTERNAL_PROJECT_SLUGS = ['full-stack-development', 'ai-and-automation', 'it-infrastructure'];
export const SECTION_SCHEMAS = {
  hero: object('Hero', {
    badge: text('Badge'), headingLine1: text('First heading line'), headingLine2: text('Second heading line'),
    paragraph: area('Introduction'), paragraphs: optional(list('Legacy paragraphs (not rendered)', area('Paragraph'))),
    primaryButton: text('Primary button label'), primaryButtonHref: url('Primary button destination'),
    secondaryButton: text('Secondary button label'), secondaryButtonHref: url('Secondary button destination'),
    profile: optional(object('Profile', {})),
  }),
  services: object('Services', { heading: text('Heading'), headingAccent: text('Highlighted heading'), subtitle: area('Introduction'),
    filterTags: list('Tags', text('Tag')), items: list('Services', object('Service', { title: text('Title'), description: area('Description') })) }),
  portfolio: object('Portfolio', { badge: text('Badge'), heading: text('Heading'), headingAccent: text('Highlighted heading'),
    subtitle: optional(area('Legacy subtitle (not rendered)')), cards: list('Projects', object('Project', {
      id: { type: 'id', label: 'Stable ID', readonly: true }, slug: text('Slug', { format: 'slug' }),
      title: text('Title'), description: area('Description'), imgSrc: url('Image reference', 'image'),
      externalUrl: url('External URL', 'external'), technology: optional(text('Technology')),
    })) }),
  about: object('About', { block1: block('First block'), block2: block('Second block'), chips: optional(list('Tags', text('Tag'))) }),
  header: object('Header', { siteName: text('Site name'), ctaButton: text('Contact button label'), navLinks: list('Navigation', link) }),
  footer: object('Footer', { logoText: text('Logo text'), siteName: text('Site name'), tagline: area('Tagline'),
    copyright: optional(text('Legacy copyright (not rendered)')), bottomSignature: optional(text('Bottom signature')), bottomLocation: optional(text('Bottom location')),
    sections: list('Link groups', object('Group', { title: text('Title'), links: list('Links', link) })), socialLinks: list('Social links', social) }),
  cta: object('CTA', { heading: text('Heading'), headingAccent: text('Highlighted heading'), headingSuffix: text('Heading suffix'),
    paragraph: area('Introduction'), button: text('Button label'), buttonHref: url('Button destination', 'internal') }),
  contact: object('Contact', { pageTitle: text('Page title'), metaDescription: area('Meta description'), heading: text('Heading'),
    headingAccent: text('Highlighted heading'), subtitle: area('Introduction'),
    infoBlocks: list('Information blocks', object('Block', { title: text('Title'), lines: list('Lines', text('Line')) })), socialLinks: list('Social links', social) }),
  stats: object('Stats', { heading: text('Heading'), headingAccent: text('Highlighted heading'), subtitle: optional(area('Legacy subtitle (not rendered)')),
    items: list('Statistics', object('Statistic', { value: { type: 'number', label: 'Value', min: 0, max: 1000000000 }, suffix: text('Suffix'), label: text('Label'), description: area('Description') })) }),
  colors: object('Colors', Object.fromEntries(['accentPurple','background','cardBackground','heroOverlay'].map(k => [k, text(k.replace(/([A-Z])/g, ' $1'), { format: 'color' })]))),
  typography: object('Typography', {
    headingFont: text('Heading font', { choices: ['mono','sans','serif'] }), bodySize: text('Body size', { choices: ['sm','md','lg'] }),
    sectionSpacing: text('Section spacing', { choices: ['compact','default','spacious'] }),
  }),
  visibility: object('Visibility', Object.fromEntries(['services','about','portfolio','stats','cta'].map(k => [k, bool(k)]))),
};
SECTION_SCHEMAS.hero.fields.profile = optional(object('Profile', {
  ...Object.fromEntries(['name','role','location','topLabel','topValue','bottomLabel','bottomValue','imageAlt'].map(k => [k, optional(text(k.replace(/([A-Z])/g, ' $1')))])),
  image: url('Image reference', 'image'),
}));
export const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
export function safeUrl(value, kind = 'link') {
  if (value === '') return true;
  if (value !== value.trim() || /[\u0000-\u0020\u007f\\]/.test(value)) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return kind !== 'external';
  if (value.startsWith('#')) return kind === 'link' || kind === 'internal';
  if (kind === 'internal') return false;
  try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !!u.hostname && !u.username && !u.password; } catch { return false; }
}
export function validateSection(section, data) {
  const errors = [];
  const error = (path, message) => errors.push({ path, message });
  const schema = SECTION_SCHEMAS[section];
  if (!schema) return [{ path: '', message: 'Unknown section' }];
  const tree = (v, path = '', depth = 0) => {
    if (depth > 24) { error(path, 'Content is too deep'); return; }
    if (typeof v === 'string') {
      if (v.length > 60000) error(path, 'Text is too long');
      if (/formspree\.io|supabase\.co/i.test(v)) error(path, 'Retired integration is not supported');
      if (/(?:href|url|image|imgSrc|formEndpoint)$/i.test(path) && !safeUrl(v)) error(path, 'Unsafe URL');
    } else if (typeof v === 'number') { if (!Number.isFinite(v)) error(path, 'Number must be finite'); }
    else if (Array.isArray(v)) { if (v.length > 1000) error(path, 'Too many items'); v.forEach((x,i) => tree(x, `${path}.${i}`, depth + 1)); }
    else if (isObject(v)) Object.entries(v).forEach(([k,x]) => {
      if (['__proto__','constructor','prototype'].includes(k)) error(path, 'Unsafe object key');
      if (k === 'formEndpoint') error(path, 'Contact destination is system controlled');
      tree(x, path ? `${path}.${k}` : k, depth + 1);
    });
    else if (v !== null && typeof v !== 'boolean') error(path, 'Invalid JSON value');
  };
  tree(data);
  const walk = (s, v, path) => {
    if (v === undefined && s.optional) return;
    if (s.type === 'object') {
      if (!isObject(v)) { error(path, 'Expected an object'); return; }
      Object.entries(s.fields).forEach(([k,f]) => walk(f, v[k], path ? `${path}.${k}` : k));
    } else if (s.type === 'array') {
      if (!Array.isArray(v)) { error(path, 'Expected a list'); return; }
      v.forEach((x,i) => walk(s.item, x, `${path}.${i}`));
    } else if (s.type === 'id') {
      if (!(Number.isSafeInteger(v) && v >= 0) && !(typeof v === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(v))) error(path, 'Expected a stable number or text ID');
    } else if (typeof v !== s.type) error(path, `Expected ${s.type}`);
    else if (s.type === 'number' && (!Number.isFinite(v) || v < s.min || v > s.max)) error(path, `Use a number between ${s.min} and ${s.max}`);
    else if (s.type === 'string') {
      if (v.length > s.max) error(path, `Maximum ${s.max} characters`);
      if (s.choices && !s.choices.includes(v)) error(path, 'Choose a supported value');
      if (s.format === 'color' && !/^#[0-9a-f]{6}$/i.test(v)) error(path, 'Use a six-digit hex color');
      if (s.format === 'slug' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)) error(path, 'Use a lowercase hyphenated slug');
      if (['link','external','image','internal'].includes(s.format) && !safeUrl(v, s.format)) error(path, 'Use a supported safe destination');
    }
  };
  walk(schema, data, '');
  if (section === 'portfolio' && Array.isArray(data?.cards)) {
    const ids = new Set(), slugs = new Set();
    data.cards.forEach((c,i) => {
      if (!isObject(c)) return;
      if (ids.has(String(c.id))) error(`cards.${i}.id`, 'Duplicate ID'); ids.add(String(c.id));
      if (slugs.has(c.slug)) error(`cards.${i}.slug`, 'Duplicate slug'); slugs.add(c.slug);
      if (!c.externalUrl && !INTERNAL_PROJECT_SLUGS.includes(c.slug)) error(`cards.${i}.externalUrl`, 'This project needs an external URL; internal detail pages use the existing three slugs');
    });
  }
  try { if (new TextEncoder().encode(JSON.stringify(data)).length > 131072) error('', 'Section exceeds 128 KiB'); } catch { error('', 'Invalid JSON'); }
  return errors;
}
// Copy only the edited branch. Unknown siblings and list item metadata survive.
export function editAt(value, path, next) {
  if (!path.length) return next;
  const [key, ...rest] = path;
  const copy = Array.isArray(value) ? [...value] : { ...value };
  if (!rest.length && next === undefined) delete copy[key];
  else copy[key] = editAt(value?.[key], rest, next);
  return copy;
}
export function newValue(schema) {
  if (schema.type === 'object') return Object.fromEntries(Object.entries(schema.fields).filter(([,f]) => !f.optional).map(([k,f]) => [k, newValue(f)]));
  if (schema.type === 'array') return [];
  if (schema.type === 'boolean') return true;
  if (schema.type === 'number') return 0;
  if (schema.type === 'id') return crypto.randomUUID();
  return schema.choices?.[0] ?? (schema.format === 'color' ? '#000000' : '');
}
