import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { BOSS_SECTIONS, sectionForPath } from './sections.js';
import { useRobotsDirective } from '@/head/useRobotsDirective';

// The Boss shell.
//
// It shares the site's palette and monospace voice so it reads as the same
// system, and it shares nothing else: no public header, no public footer, no
// marketing navigation. Cloudflare Access plus the Worker's own verification
// are the security boundary; nothing here authenticates or authorises, and
// there is no second login.

const NavigationItem = ({ section }) => (
  <NavLink
    to={section.path}
    end={section.path === '/boss'}
    data-boss-nav={section.id}
    className={({ isActive }) =>
      [
        'group flex items-baseline gap-2 px-3 py-2 rounded border font-mono text-sm transition-colors',
        isActive
          ? 'border-accent-purple/40 bg-accent-purple/10 text-white'
          : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5',
      ].join(' ')
    }
  >
    {({ isActive }) => (
      <>
        <span className={isActive ? 'text-accent-purple select-none' : 'text-gray-700 select-none'}>&#10095;</span>
        <span className="truncate">{section.label}</span>
      </>
    )}
  </NavLink>
);

const BossLayout = () => {
  const location = useLocation();
  const section = sectionForPath(location.pathname);
  const title = section ? `${section.label} — Boss` : 'Boss';

  // The private surface is never indexable, in any environment. This rewrites
  // the document's single robots directive rather than adding a second one.
  useRobotsDirective('noindex, nofollow');

  return (
    <div className="min-h-screen bg-[#090909] text-gray-200">
      <Helmet>
        <title>{title} | hakan.run</title>
      </Helmet>

      <header className="border-b border-white/10 bg-[#0c0c0c]">
        <div className="mx-auto max-w-7xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-lg text-white">
              &lt;h<span className="text-accent-purple">/</span>&gt;
            </span>
            <span className="font-mono text-sm text-gray-500">boss</span>
          </div>
          <p className="font-mono text-xs text-gray-600" data-boss-breadcrumb>
            <span className="text-accent-purple select-none">&#10095;</span>{' '}
            {location.pathname}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-6 flex flex-col lg:flex-row gap-6">
        <nav aria-label="Boss sections" className="lg:w-56 shrink-0">
          <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible scrollbar-hide">
            {BOSS_SECTIONS.map((item) => (
              <li key={item.id} className="shrink-0 lg:shrink">
                <NavigationItem section={item} />
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1 min-w-0">
          {section ? (
            <div className="mb-8">
              <h1 className="font-mono text-2xl text-white">{section.label}</h1>
              <p className="font-mono text-xs text-gray-600 mt-1">
                <span className="text-gray-700 select-none">{'/* '}</span>
                {section.summary}
                <span className="text-gray-700 select-none">{' */'}</span>
              </p>
            </div>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default BossLayout;
