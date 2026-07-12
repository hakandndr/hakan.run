import React, { createContext, useContext, useState, useEffect } from 'react';
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

export const ContentProvider = ({ children }) => {
  const [content, setContent] = useState(() => {
    try {
      const stored = localStorage.getItem('siteContent');
      return stored ? { ...siteContent, ...JSON.parse(stored) } : siteContent;
    } catch {
      return siteContent;
    }
  });

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
        setContent(prev => ({ ...prev, ...remote }));
      } catch (e) {
        console.error('[Content] Supabase fetch threw:', e);
      }
    })();
  }, []);

  const updateContent = async (section, value) => {
    setContent(prev => {
      const next = { ...prev, [section]: value };
      try { localStorage.setItem('siteContent', JSON.stringify(next)); } catch (_) {}
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
    <ContentContext.Provider value={{ content, updateContent }}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => useContext(ContentContext);
