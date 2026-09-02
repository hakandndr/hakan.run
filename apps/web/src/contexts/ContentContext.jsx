import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { siteContent } from '@/content';
import { supabase } from '@/lib/supabase';

const ContentContext = createContext(null);

const hexToRgbChannels = (hex) => {
  const c = hex.replace('#', '');
  return `${parseInt(c.slice(0,2),16)} ${parseInt(c.slice(2,4),16)} ${parseInt(c.slice(4,6),16)}`;
};

const hexToRgba = (hex, alpha) => {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0,2),16);
  const g = parseInt(c.slice(2,4),16);
  const b = parseInt(c.slice(4,6),16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const applyColors = (colors) => {
  const root = document.documentElement;
  root.style.setProperty('--color-accent-rgb', hexToRgbChannels(colors.accentPurple));
  root.style.setProperty('--color-bg', colors.background);
  root.style.setProperty('--color-card-bg', colors.cardBackground);
  root.style.setProperty('--color-hero-overlay', hexToRgba(colors.heroOverlay ?? '#000000', 0.4));
};

const applyTypography = (typography) => {
  if (!typography) return;
  const body = document.body;
  body.setAttribute('data-heading-font', typography.headingFont || 'mono');
  body.setAttribute('data-body-size', typography.bodySize || 'md');
  body.setAttribute('data-spacing', typography.sectionSpacing || 'default');
};

// `siteContent` in localStorage is the single local content authority: the
// last known-good content, written both by Control Room saves and by every
// successful Supabase read. When it exists, the very first paint already shows
// the content Supabase is about to confirm, so the document height does not
// change after load and the browser's own scroll restoration lands correctly.
const readStoredContent = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('siteContent') || 'null');
    return stored && typeof stored === 'object' && Object.keys(stored).length ? stored : null;
  } catch {
    return null;
  }
};

const writeStoredContent = (next) => {
  try {
    localStorage.setItem('siteContent', JSON.stringify(next));
  } catch {
    /* storage unavailable — the next load simply falls back to source content */
  }
};

export const ContentProvider = ({ children }) => {
  const storedOnBoot = useRef(readStoredContent());
  const [content, setContent] = useState(() =>
    storedOnBoot.current ? { ...siteContent, ...storedOnBoot.current } : siteContent,
  );

  // The readiness gate now exists for exactly one case: a first, uncached visit
  // to a Supabase-backed site, where the shipped source content may be stale and
  // there is nothing known-good to paint. Any load that already has known-good
  // content renders immediately and is never gated.
  const [contentReady, setContentReady] = useState(() => !supabase || !!storedOnBoot.current);

  useEffect(() => { applyColors(content.colors); },      [content.colors]);
  useEffect(() => { applyTypography(content.typography); }, [content.typography]);

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      try {
        const { data, error } = await supabase.from('site_content').select('section, data');
        if (error) { console.error('[Content] Supabase fetch error:', error.message); return; }
        if (!data?.length) { console.warn('[Content] Supabase returned no rows'); return; }
        const remote = data.reduce((acc, row) => { acc[row.section] = row.data; return acc; }, {});
        // Persist the authoritative result so the next load starts from it.
        setContent(prev => {
          const next = { ...prev, ...remote };
          writeStoredContent({ ...(readStoredContent() ?? {}), ...remote });
          return next;
        });
      } catch (e) {
        console.error('[Content] Supabase fetch threw:', e);
      } finally {
        setContentReady(true);
      }
    })();
  }, []);

  const updateContent = async (section, value) => {
    setContent(prev => {
      const next = { ...prev, [section]: value };
      writeStoredContent({ ...(readStoredContent() ?? {}), [section]: value });
      return next;
    });

    if (!supabase) {
      console.warn('[Admin] Supabase not configured — saved to localStorage only');
      return;
    }

    const { error } = await supabase
      .from('site_content')
      .upsert({ section, data: value }, { onConflict: 'section' });

    if (error) console.error('[Admin] Supabase save FAILED for', section, '—', error.message);
    else        console.log('[Admin] Saved to Supabase:', section);
  };

  return (
    <ContentContext.Provider value={{ content, updateContent, contentReady }}>
      {/*
        Only an uncached first load is ever gated. The tree stays mounted so the
        document keeps its real layout height; `display: contents` keeps the
        wrapper out of layout and the inherited `visibility: hidden` makes sure
        no stale source content is painted before Supabase confirms it.
      */}
      <div
        data-content-ready={contentReady ? 'true' : 'false'}
        aria-hidden={contentReady ? undefined : 'true'}
        style={{ display: 'contents', visibility: contentReady ? undefined : 'hidden' }}
      >
        {children}
      </div>
    </ContentContext.Provider>
  );
};

export const useContent = () => useContext(ContentContext);
