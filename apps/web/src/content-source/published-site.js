import { SECTION_SCHEMAS, validateSection } from './schema.js';

export const CONTENT_ENDPOINT = '/api/content';
export const CONTENT_CONTRACT = 1;

export const REQUIRED_PUBLIC_SECTIONS = Object.freeze([
  'colors',
  'typography',
  'visibility',
  'header',
  'hero',
  'services',
  'about',
  'portfolio',
  'stats',
  'cta',
  'contact',
  'footer',
]);

const requiredSectionIds = new Set(REQUIRED_PUBLIC_SECTIONS);

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const deepFreeze = (value) => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
};

export class PublishedSiteError extends Error {
  constructor(code, details = null) {
    super(code);
    this.name = 'PublishedSiteError';
    this.code = code;
    this.details = details;
  }
}

const fail = (code, details) => {
  throw new PublishedSiteError(code, details);
};

/**
 * Validate an API-shaped value and create the one immutable object the public
 * renderer is allowed to consume. No defaults or partial results enter here.
 */
export const createPublishedSiteSnapshot = (payload) => {
  if (!isPlainObject(payload)) fail('malformed_response');
  if (payload.contract !== CONTENT_CONTRACT) fail('unsupported_contract');
  if (!Array.isArray(payload.sections)) fail('malformed_response');
  if (!Number.isSafeInteger(payload.count) || payload.count !== payload.sections.length) {
    fail('malformed_response');
  }
  if (payload.sections.length === 0) fail('empty_content');
  if (!Number.isSafeInteger(payload.publishedAt) || payload.publishedAt <= 0) {
    fail('malformed_response');
  }

  const content = {};
  const revisions = {};

  for (const section of payload.sections) {
    if (!isPlainObject(section) || typeof section.id !== 'string' || !isPlainObject(section.data)) {
      fail('malformed_response');
    }
    if (!requiredSectionIds.has(section.id) || !SECTION_SCHEMAS[section.id]) {
      fail('unknown_section', { section: section.id });
    }
    if (Object.hasOwn(content, section.id)) {
      fail('duplicate_section', { section: section.id });
    }
    if (!Number.isSafeInteger(section.revision) || section.revision < 1 ||
        !Number.isSafeInteger(section.publishedAt) || section.publishedAt <= 0) {
      fail('malformed_response');
    }

    const errors = validateSection(section.id, section.data);
    if (errors.length > 0) {
      fail('invalid_section', { section: section.id, errors });
    }
    content[section.id] = structuredClone(section.data);
    revisions[section.id] = section.revision;
  }

  const missing = REQUIRED_PUBLIC_SECTIONS.filter((id) => !Object.hasOwn(content, id));
  if (missing.length > 0 || payload.sections.length !== REQUIRED_PUBLIC_SECTIONS.length) {
    fail('missing_section', { sections: missing });
  }
  const latestSectionPublication = Math.max(...payload.sections.map((section) => section.publishedAt));
  if (payload.publishedAt !== latestSectionPublication) fail('malformed_response');

  const orderedContent = Object.fromEntries(REQUIRED_PUBLIC_SECTIONS.map((id) => [id, content[id]]));
  const orderedRevisions = Object.fromEntries(REQUIRED_PUBLIC_SECTIONS.map((id) => [id, revisions[id]]));

  return deepFreeze({
    contract: CONTENT_CONTRACT,
    publishedAt: payload.publishedAt,
    content: orderedContent,
    revisions: orderedRevisions,
  });
};

export const loadPublishedSiteSnapshot = async (fetchImpl = fetch) => {
  let response;
  try {
    response = await fetchImpl(CONTENT_ENDPOINT, {
      headers: { accept: 'application/json' },
      credentials: 'same-origin',
    });
  } catch {
    fail('transport_failure');
  }

  if (response.redirected) fail('redirected_response');
  if (!response.ok) fail(`http_${response.status}`);
  if (!/application\/json/i.test(response.headers?.get?.('content-type') ?? '')) {
    fail('invalid_content_type');
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    fail('invalid_json');
  }

  return createPublishedSiteSnapshot(payload);
};
