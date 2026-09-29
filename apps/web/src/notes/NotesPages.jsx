import React from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import NotFound from '@/pages/NotFound';
import { FEATURED_NOTES, getNote, NOTES } from './catalog';

const intro = 'Engineering decisions, failures and operational lessons from systems I have built.';

const NoteLink = ({ note }) => (
  <li className="border-t border-white/10 py-7 first:border-t-0">
    <Link className="group block rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-purple" to={`/notes/${note.slug}`}>
      <span className="font-mono text-xs text-accent-purple/80">{note.topic} · {note.project} · {note.date}</span>
      <h2 className="mt-2 text-xl sm:text-2xl font-semibold text-white group-hover:text-accent-purple transition-colors">{note.title}</h2>
      <p className="mt-2 text-sm sm:text-base leading-relaxed text-gray-400">{note.deck}</p>
    </Link>
  </li>
);

export const NotesHomeSection = () => (
  <section id="notes" data-public-section="notes" className="bg-[#0D0D0D] border-y border-white/[0.06] py-20 sm:py-24">
    <div className="container mx-auto px-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-purple/80">Engineering / Notes</p>
      <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
        <div><h2 className="text-3xl sm:text-4xl font-bold text-white">Engineering Notes</h2><p className="mt-3 text-gray-400 max-w-2xl">{intro}</p></div>
        <Link to="/notes" className="font-mono text-sm text-accent-purple hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-purple">View all notes →</Link>
      </div>
      <ul className="mt-10 grid gap-6 md:grid-cols-3">
        {FEATURED_NOTES.map((note) => <li key={note.slug} className="border-t border-white/15 pt-5"><Link className="group block rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-purple" to={`/notes/${note.slug}`}><span className="font-mono text-xs text-accent-purple/70">{note.topic}</span><h3 className="mt-2 text-lg font-semibold group-hover:text-accent-purple transition-colors">{note.title}</h3><p className="mt-2 text-sm text-gray-400 leading-relaxed">{note.deck}</p></Link></li>)}
      </ul>
    </div>
  </section>
);

export const NotesIndex = () => (
  <section data-public-section="notes-index" className="min-h-screen bg-[#090909] pt-36 pb-24 px-6">
    <Helmet><title>Engineering Notes | Hakan Dundar</title><meta name="description" content={intro} /><meta property="og:title" content="Engineering Notes" /><meta property="og:description" content={intro} /><meta property="og:url" content="https://hakan.run/notes" /></Helmet>
    <div className="max-w-3xl mx-auto">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-purple/80">Engineering / Notes</p>
      <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-white">Engineering Notes</h1>
      <p className="mt-5 text-base sm:text-lg leading-relaxed text-gray-400">{intro}</p>
      <ul className="mt-12">{NOTES.map((note) => <NoteLink key={note.slug} note={note} />)}</ul>
    </div>
  </section>
);

export const NotesArticle = () => {
  const { slug } = useParams();
  const note = getNote(slug);
  if (!note) return <NotFound />;
  return (
    <article data-public-section="note-article" className="min-h-screen bg-[#090909] pt-36 pb-24 px-6">
      <Helmet><title>{note.title} | Hakan Dundar</title><meta name="description" content={note.deck} /><meta property="og:title" content={note.title} /><meta property="og:description" content={note.deck} /><meta property="og:url" content={`https://hakan.run/notes/${note.slug}`} /></Helmet>
      <div className="max-w-3xl mx-auto">
        <Link to="/notes" className="font-mono text-sm text-accent-purple hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-purple">← Back to Notes</Link>
        <header className="mt-10 border-b border-white/10 pb-10">
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-accent-purple/75">{note.topic} · {note.project}</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold leading-tight tracking-tight text-white">{note.title}</h1>
          <p className="mt-5 text-lg sm:text-xl leading-relaxed text-gray-400">{note.deck}</p>
          <time dateTime={note.date} className="mt-6 block font-mono text-xs text-gray-400">{note.date}</time>
        </header>
        <div className="notes-prose mt-10" dangerouslySetInnerHTML={{ __html: note.html }} />
        <p className="mt-14 border-t border-white/10 pt-8 text-lg text-gray-300">— Hakan</p>
      </div>
    </article>
  );
};
