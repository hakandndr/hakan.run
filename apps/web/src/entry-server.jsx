import React from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { Helmet } from 'react-helmet';
import Application from '@/Application';
import BootIntro from '@/components/BootIntro';
import { createPublishedSiteSnapshot } from '@/content-source/published-site';
import { NotesArticle, NotesIndex } from '@/notes/NotesPages';
import { getNote } from '@/notes/catalog';

// Render one element and collect the title and meta tags it declared through
// Helmet. Collecting also resets Helmet's server state, which must happen even
// when rendering throws, or the next document would inherit these tags.
const renderWithHead = (element) => {
  let markup;
  let helmet;
  try {
    markup = renderToString(element);
  } finally {
    helmet = Helmet.renderStatic();
  }
  return { markup, head: { title: helmet.title.toString(), meta: helmet.meta.toString() } };
};

// Server rendering for public documents. The Worker passes the same payload
// that /api/content serves, and the browser hydrates the markup with that
// payload, so the first paint and the hydrated application come from one
// component tree and one content authority. The route's head comes from the
// same render.
export const renderPublicApplication = ({ url, payload }) => {
  const snapshot = createPublishedSiteSnapshot(payload);
  return renderWithHead(
    <Application snapshot={snapshot} router={StaticRouter} routerProps={{ location: url }} />,
  );
};

// Body of the static Notes asset, used only when the Worker cannot read APP_DB.
// The same Notes components render it, so it is the live article markup
// without the APP_DB-owned header and footer.
export const renderNotesFallback = (pathname) => {
  const slug = pathname === '/notes' ? null : pathname.slice('/notes/'.length);
  if (slug && !getNote(slug)) throw new Error(`Unknown note: ${slug}`);
  return renderWithHead(
    <StaticRouter location={pathname}>{slug ? <NotesArticle slug={slug} /> : <NotesIndex />}</StaticRouter>,
  );
};

// Static first-entry overlay written into every public document by the build.
export const renderBootIntro = () => renderToStaticMarkup(<BootIntro />);
