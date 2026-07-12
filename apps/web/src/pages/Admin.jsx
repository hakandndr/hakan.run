import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '@/contexts/ContentContext';
import { supabase } from '@/lib/supabase';
import { siteContent } from '@/content';

const TAB_GROUPS = [
  { label: 'Content',   tabs: ['Hero', 'Services', 'About', 'Portfolio', 'Stats', 'CTA', 'Contact', 'Footer'] },
  { label: 'Design',    tabs: ['Colors', 'Typography', 'Visibility'] },
  { label: 'Analytics', tabs: ['Tracker'] },
  { label: 'Security',  tabs: ['2FA'] },
];

// ── Shared primitives ──────────────────────────────────────────────────────

const Field = ({ label, value, onChange, multiline = false, hint }) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</label>
    {multiline
      ? <textarea value={value} onChange={onChange} rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-y" />
      : <input type="text" value={value} onChange={onChange}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
    }
    {hint && <p className="text-xs text-gray-600 mt-1">{hint}</p>}
  </div>
);

const SaveBtn = ({ onClick }) => (
  <button onClick={onClick}
    className="mt-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2 rounded-lg transition-colors text-sm">
    Save Changes
  </button>
);

const SectionTitle = ({ children }) => (
  <h2 className="text-xl font-bold text-white mb-6 pb-3 border-b border-gray-800">{children}</h2>
);

const CardBox = ({ children }) => (
  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-4">{children}</div>
);

const ToggleSwitch = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${value ? 'bg-blue-600' : 'bg-gray-700'}`}
  >
    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
  </button>
);

const SegmentedControl = ({ value, onChange, options }) => (
  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
    {options.map(([val, label]) => (
      <button key={val} onClick={() => onChange(val)}
        className={`px-2 py-2 rounded-lg text-xs font-medium border transition-colors text-center ${
          value === val
            ? 'bg-blue-600 border-blue-500 text-white'
            : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
        }`}
      >
        {label}
      </button>
    ))}
  </div>
);

const ItemControls = ({ i, total, onMove, onRemove }) => (
  <div className="flex items-center gap-1">
    <button onClick={() => onMove(i, -1)} disabled={i === 0}
      className="text-gray-500 hover:text-white disabled:opacity-25 px-1.5 py-0.5 text-sm transition-colors" title="Move up">↑</button>
    <button onClick={() => onMove(i, 1)} disabled={i === total - 1}
      className="text-gray-500 hover:text-white disabled:opacity-25 px-1.5 py-0.5 text-sm transition-colors" title="Move down">↓</button>
    <button onClick={() => onRemove(i)}
      className="text-red-400 hover:text-red-300 px-1.5 py-0.5 text-sm transition-colors" title="Remove">×</button>
  </div>
);

const ButtonFields = ({ label, labelKey, hrefKey, form, set, defaultHref = '/' }) => (
  <div className="border-t border-gray-800 mt-4 mb-4 pt-4">
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{label}</p>
    <Field label="Label" value={form[labelKey] ?? ''} onChange={e => set(labelKey, e.target.value)} />
    <Field label="Link / Href" value={form[hrefKey] ?? defaultHref} onChange={e => set(hrefKey, e.target.value)}
      hint="Use #anchor for scroll, /path for internal, https:// for external" />
  </div>
);

const formatPstDate = (dateString) => {
  if (typeof dateString !== 'string') return dateString ?? '-';
  const parts = dateString.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
  if (!parts) return dateString;
  const [ , year, month, day, hour, minute, second ] = parts;
  const hourNum = Number(hour);
  const ampm = hourNum >= 12 ? 'PM' : 'AM';
  const hour12 = String(hourNum % 12 || 12).padStart(2, '0');
  return `${year}-${month}-${day} ${hour12}:${minute}:${second} ${ampm}`;
};

const detectSourceLabel = ({ ip, ua_full, referrer, referrer_raw }) => {
  const ipString = String(ip ?? '').trim();
  if (ipString.startsWith('205.169.39.')) {
    return 'Palo Alto Scanner';
  }

  const rawText = [ua_full, referrer_raw, referrer]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/\bgooglebot\b/.test(rawText) || /\badsbot-google\b/.test(rawText) || /\bgoogle.*bot\b/.test(rawText)) {
    return 'Googlebot';
  }

  if (/\bbingbot\b/.test(rawText) || /\bmsnbot\b/.test(rawText) || /\bbingpreview\b/.test(rawText) || (/\bmicrosoft\b/.test(rawText) && /\b(bot|crawler)\b/.test(rawText))) {
    return 'Bingbot';
  }

  if (/\blinkedinbot\b/.test(rawText) || /\blinkedin\.com/.test(rawText)) {
    return 'LinkedIn';
  }

  if (/\bfacebookexternalhit\b/.test(rawText) || /\bfacebot\b/.test(rawText) || /\binstagram\b/.test(rawText) || /\bmeta\b/.test(rawText) || /\bfacebook\.com/.test(rawText) || /\bfbclid\b/.test(rawText) || /\butm_source=ig\b/.test(rawText) || /\bigshid\b/.test(rawText)) {
    return 'Meta';
  }

  return 'Unknown';
};

// ── Tab: Hero ──────────────────────────────────────────────────────────────

const HeroTab = ({ content, updateContent }) => {
  const [form, setForm] = useState(content.hero);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div>
      <SectionTitle>Hero</SectionTitle>
      <Field label="Badge Text" value={form.badge} onChange={e => set('badge', e.target.value)} />
      <Field label="Heading Line 1" value={form.headingLine1} onChange={e => set('headingLine1', e.target.value)} />
      <Field label="Heading Line 2 (accent color)" value={form.headingLine2} onChange={e => set('headingLine2', e.target.value)} />
      <Field label="Paragraph" value={form.paragraph} onChange={e => set('paragraph', e.target.value)} multiline />
      <ButtonFields label="Primary Button" labelKey="primaryButton" hrefKey="primaryButtonHref"
        form={form} set={set} defaultHref="#portfolio" />
      <ButtonFields label="Secondary Button" labelKey="secondaryButton" hrefKey="secondaryButtonHref"
        form={form} set={set} defaultHref="/contact" />
      <SaveBtn onClick={() => updateContent('hero', form)} />
    </div>
  );
};

// ── Tab: Services ──────────────────────────────────────────────────────────

const ServicesTab = ({ content, updateContent }) => {
  const [form, setForm] = useState(content.services);
  const setRoot = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setItem = (i, k, v) => setForm(f => ({
    ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [k]: v } : it),
  }));
  const moveItem = (i, dir) => setForm(f => {
    const items = [...f.items];
    const j = i + dir;
    if (j < 0 || j >= items.length) return f;
    [items[i], items[j]] = [items[j], items[i]];
    return { ...f, items };
  });
  const addItem = () => setForm(f => ({
    ...f, items: [...f.items, { title: 'New Service', description: '' }],
  }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  return (
    <div>
      <SectionTitle>Services / Expertise</SectionTitle>
      <Field label="Heading" value={form.heading} onChange={e => setRoot('heading', e.target.value)} />
      <Field label="Heading Accent" value={form.headingAccent} onChange={e => setRoot('headingAccent', e.target.value)} />
      <Field label="Subtitle" value={form.subtitle} onChange={e => setRoot('subtitle', e.target.value)} multiline />
      <Field label="Filter Tags (comma-separated)" value={form.filterTags.join(', ')}
        onChange={e => setRoot('filterTags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} />
      <div className="flex items-center justify-between mb-3 mt-2">
        <p className="text-xs text-gray-500">Expertise Items</p>
        <button onClick={addItem} className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg transition-colors">
          + Add Item
        </button>
      </div>
      {form.items.map((item, i) => (
        <CardBox key={i}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-gray-400">Item {i + 1}</span>
            <ItemControls i={i} total={form.items.length} onMove={moveItem} onRemove={removeItem} />
          </div>
          <Field label="Title" value={item.title} onChange={e => setItem(i, 'title', e.target.value)} />
          <Field label="Description" value={item.description} onChange={e => setItem(i, 'description', e.target.value)} multiline />
        </CardBox>
      ))}
      <SaveBtn onClick={() => updateContent('services', form)} />
    </div>
  );
};

// ── Tab: About ─────────────────────────────────────────────────────────────

const AboutTab = ({ content, updateContent }) => {
  const [form, setForm] = useState(content.about);
  const setBlock = (block, k, v) => setForm(f => ({ ...f, [block]: { ...f[block], [k]: v } }));
  const setSection = (block, i, k, v) => setForm(f => ({
    ...f,
    [block]: {
      ...f[block],
      sections: f[block].sections.map((s, idx) => idx === i ? { ...s, [k]: v } : s),
    },
  }));

  const renderBlock = (key, label) => (
    <>
      <p className="text-sm font-semibold text-gray-300 mb-3">{label}</p>
      <Field label="Heading" value={form[key].heading} onChange={e => setBlock(key, 'heading', e.target.value)} />
      <Field label="Heading Accent" value={form[key].headingAccent} onChange={e => setBlock(key, 'headingAccent', e.target.value)} />
      <Field label="Image URL" value={form[key].image} onChange={e => setBlock(key, 'image', e.target.value)} />
      <Field label="Image Alt" value={form[key].imageAlt} onChange={e => setBlock(key, 'imageAlt', e.target.value)} />
      {form[key].sections.map((s, i) => (
        <CardBox key={i}>
          <Field label="Section Title" value={s.title} onChange={e => setSection(key, i, 'title', e.target.value)} />
          <Field label="Body" value={s.body} onChange={e => setSection(key, i, 'body', e.target.value)} multiline />
        </CardBox>
      ))}
    </>
  );

  return (
    <div>
      <SectionTitle>About</SectionTitle>
      {renderBlock('block1', 'Block 1 — Left Image')}
      <div className="border-t border-gray-800 my-6" />
      {renderBlock('block2', 'Block 2 — Right Image')}
      <SaveBtn onClick={() => updateContent('about', form)} />
    </div>
  );
};

// ── Tab: Portfolio ─────────────────────────────────────────────────────────

const PortfolioTab = ({ content, updateContent }) => {
  const [form, setForm] = useState(content.portfolio);
  const setRoot = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setCard = (i, k, v) => setForm(f => ({
    ...f, cards: f.cards.map((c, idx) => idx === i ? { ...c, [k]: v } : c),
  }));
  const moveCard = (i, dir) => setForm(f => {
    const cards = [...f.cards];
    const j = i + dir;
    if (j < 0 || j >= cards.length) return f;
    [cards[i], cards[j]] = [cards[j], cards[i]];
    return { ...f, cards };
  });
  const addCard = () => setForm(f => ({
    ...f, cards: [...f.cards, { id: Date.now(), slug: '', title: 'New Project', description: '', imgSrc: '', externalUrl: '' }],
  }));
  const removeCard = (i) => setForm(f => ({ ...f, cards: f.cards.filter((_, idx) => idx !== i) }));

  return (
    <div>
      <SectionTitle>Portfolio</SectionTitle>
      <Field label="Badge" value={form.badge} onChange={e => setRoot('badge', e.target.value)} />
      <Field label="Heading" value={form.heading} onChange={e => setRoot('heading', e.target.value)} />
      <Field label="Heading Accent" value={form.headingAccent} onChange={e => setRoot('headingAccent', e.target.value)} />
      <Field label="Subtitle" value={form.subtitle} onChange={e => setRoot('subtitle', e.target.value)} multiline />
      <div className="flex items-center justify-between mb-3 mt-2">
        <p className="text-xs text-gray-500">Cards</p>
        <button onClick={addCard} className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg transition-colors">
          + Add Card
        </button>
      </div>
      {form.cards.map((card, i) => (
        <CardBox key={card.id}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-gray-400">Card {i + 1}</span>
            <ItemControls i={i} total={form.cards.length} onMove={moveCard} onRemove={removeCard} />
          </div>
          <Field label="Title" value={card.title} onChange={e => setCard(i, 'title', e.target.value)} />
          <Field label="Slug (→ /project/[slug])" value={card.slug} onChange={e => setCard(i, 'slug', e.target.value)} />
          <Field label="External URL (overrides slug)" value={card.externalUrl ?? ''}
            onChange={e => setCard(i, 'externalUrl', e.target.value)}
            hint="If set, clicking opens this URL in a new tab instead of the project page" />
          <Field label="Description" value={card.description} onChange={e => setCard(i, 'description', e.target.value)} multiline />
          <Field label="Image URL" value={card.imgSrc} onChange={e => setCard(i, 'imgSrc', e.target.value)} />
        </CardBox>
      ))}
      <SaveBtn onClick={() => updateContent('portfolio', form)} />
    </div>
  );
};

// ── Tab: Stats ─────────────────────────────────────────────────────────────

const StatsTab = ({ content, updateContent }) => {
  const [form, setForm] = useState(content.stats);
  const setRoot = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setItem = (i, k, v) => setForm(f => ({
    ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [k]: v } : it),
  }));
  const addItem = () => setForm(f => ({
    ...f, items: [...f.items, { value: 0, suffix: '+', label: 'New Metric', description: '' }],
  }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  return (
    <div>
      <SectionTitle>Stats</SectionTitle>
      <Field label="Heading" value={form.heading} onChange={e => setRoot('heading', e.target.value)} />
      <Field label="Heading Accent" value={form.headingAccent} onChange={e => setRoot('headingAccent', e.target.value)} />
      <Field label="Subtitle" value={form.subtitle} onChange={e => setRoot('subtitle', e.target.value)} multiline />
      <div className="flex items-center justify-between mb-3 mt-2">
        <p className="text-xs text-gray-500">Stat Items</p>
        <button onClick={addItem} className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg transition-colors">
          + Add Stat
        </button>
      </div>
      {form.items.map((item, i) => (
        <CardBox key={i}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-gray-400">Stat {i + 1}</span>
            <button onClick={() => removeItem(i)} className="text-xs text-red-400 hover:text-red-300 transition-colors">× Remove</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Value" value={String(item.value)} onChange={e => setItem(i, 'value', parseFloat(e.target.value) || 0)} />
            <Field label="Suffix (e.g. +, %, x)" value={item.suffix} onChange={e => setItem(i, 'suffix', e.target.value)} />
          </div>
          <Field label="Label" value={item.label} onChange={e => setItem(i, 'label', e.target.value)} />
          <Field label="Description" value={item.description} onChange={e => setItem(i, 'description', e.target.value)} multiline />
        </CardBox>
      ))}
      <SaveBtn onClick={() => updateContent('stats', form)} />
    </div>
  );
};

// ── Tab: CTA ───────────────────────────────────────────────────────────────

const CTATab = ({ content, updateContent }) => {
  const [form, setForm] = useState(content.cta);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div>
      <SectionTitle>CTA</SectionTitle>
      <Field label="Heading" value={form.heading} onChange={e => set('heading', e.target.value)} />
      <Field label="Heading Accent" value={form.headingAccent} onChange={e => set('headingAccent', e.target.value)} />
      <Field label="Heading Suffix (e.g. ?)" value={form.headingSuffix} onChange={e => set('headingSuffix', e.target.value)} />
      <Field label="Paragraph" value={form.paragraph} onChange={e => set('paragraph', e.target.value)} multiline />
      <ButtonFields label="Button" labelKey="button" hrefKey="buttonHref"
        form={form} set={set} defaultHref="/contact" />
      <SaveBtn onClick={() => updateContent('cta', form)} />
    </div>
  );
};

// ── Tab: Contact ───────────────────────────────────────────────────────────

const ContactTab = ({ content, updateContent }) => {
  const [form, setForm] = useState(content.contact);
  const setRoot = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setBlock = (i, k, v) => setForm(f => ({
    ...f, infoBlocks: f.infoBlocks.map((b, idx) => idx === i ? { ...b, [k]: v } : b),
  }));
  const setSocial = (i, k, v) => setForm(f => ({
    ...f, socialLinks: f.socialLinks.map((l, idx) => idx === i ? { ...l, [k]: v } : l),
  }));
  return (
    <div>
      <SectionTitle>Contact</SectionTitle>
      <Field label="Page Title" value={form.pageTitle} onChange={e => setRoot('pageTitle', e.target.value)} />
      <Field label="Meta Description" value={form.metaDescription} onChange={e => setRoot('metaDescription', e.target.value)} multiline />
      <Field label="Heading" value={form.heading} onChange={e => setRoot('heading', e.target.value)} />
      <Field label="Heading Accent" value={form.headingAccent} onChange={e => setRoot('headingAccent', e.target.value)} />
      <Field label="Subtitle" value={form.subtitle} onChange={e => setRoot('subtitle', e.target.value)} multiline />
      <Field label="Form Endpoint" value={form.formEndpoint} onChange={e => setRoot('formEndpoint', e.target.value)} />
      <p className="text-xs text-gray-500 mb-3 mt-1">Info Blocks</p>
      {form.infoBlocks.map((block, i) => (
        <CardBox key={i}>
          <Field label="Title" value={block.title} onChange={e => setBlock(i, 'title', e.target.value)} />
          <Field label="Lines (comma-separated)" value={block.lines.join(', ')}
            onChange={e => setBlock(i, 'lines', e.target.value.split(',').map(l => l.trim()).filter(Boolean))} />
        </CardBox>
      ))}
      <p className="text-xs text-gray-500 mb-3 mt-1">Social Links</p>
      {form.socialLinks.map((link, i) => (
        <CardBox key={i}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" value={link.name} onChange={e => setSocial(i, 'name', e.target.value)} />
            <Field label="URL" value={link.url} onChange={e => setSocial(i, 'url', e.target.value)} />
          </div>
        </CardBox>
      ))}
      <SaveBtn onClick={() => updateContent('contact', form)} />
    </div>
  );
};

// ── Tab: Footer ────────────────────────────────────────────────────────────

const FooterTab = ({ content, updateContent }) => {
  const [form, setForm] = useState(content.footer);
  const setRoot = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setNavLink = (si, li, k, v) => setForm(f => ({
    ...f,
    sections: f.sections.map((sec, sIdx) => sIdx !== si ? sec : {
      ...sec, links: sec.links.map((l, lIdx) => lIdx !== li ? l : { ...l, [k]: v }),
    }),
  }));
  const setSocial = (i, k, v) => setForm(f => ({
    ...f, socialLinks: f.socialLinks.map((l, idx) => idx === i ? { ...l, [k]: v } : l),
  }));
  return (
    <div>
      <SectionTitle>Footer</SectionTitle>
      <Field label="Logo Text" value={form.logoText} onChange={e => setRoot('logoText', e.target.value)} />
      <Field label="Site Name" value={form.siteName} onChange={e => setRoot('siteName', e.target.value)} />
      <Field label="Tagline" value={form.tagline} onChange={e => setRoot('tagline', e.target.value)} />
      <Field label="Copyright" value={form.copyright} onChange={e => setRoot('copyright', e.target.value)} />
      <p className="text-xs text-gray-500 mb-3 mt-1">Navigation Sections</p>
      {form.sections.map((sec, si) => (
        <CardBox key={si}>
          <Field label="Section Title" value={sec.title} onChange={e => setForm(f => ({
            ...f, sections: f.sections.map((s, i) => i === si ? { ...s, title: e.target.value } : s),
          }))} />
          {sec.links.map((link, li) => (
            <div key={li} className="grid grid-cols-2 gap-3">
              <Field label="Name" value={link.name} onChange={e => setNavLink(si, li, 'name', e.target.value)} />
              <Field label="Href" value={link.href} onChange={e => setNavLink(si, li, 'href', e.target.value)} />
            </div>
          ))}
        </CardBox>
      ))}
      <p className="text-xs text-gray-500 mb-3 mt-1">Social Links</p>
      {form.socialLinks.map((link, i) => (
        <CardBox key={i}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" value={link.name} onChange={e => setSocial(i, 'name', e.target.value)} />
            <Field label="URL" value={link.url} onChange={e => setSocial(i, 'url', e.target.value)} />
          </div>
        </CardBox>
      ))}
      <SaveBtn onClick={() => updateContent('footer', form)} />
    </div>
  );
};

// ── Tab: Colors ────────────────────────────────────────────────────────────

const COLOR_LABELS = {
  accentPurple: 'Accent / Highlight Color',
  background: 'Page Background',
  cardBackground: 'Card Background',
  heroOverlay: 'Hero / CTA Overlay Tint',
};

const ColorsTab = ({ content, updateContent }) => {
  const [form, setForm] = useState({ ...siteContent.colors, ...content.colors });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div>
      <SectionTitle>Colors</SectionTitle>
      <p className="text-sm text-gray-400 mb-6">Color changes apply immediately after saving.</p>
      {Object.entries(form).map(([key, value]) => (
        <div key={key} className="flex items-center gap-4 mb-5">
          <input type="color" value={value} onChange={e => set(key, e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent shrink-0" />
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              {COLOR_LABELS[key] || key}
            </label>
            <input type="text" value={value} onChange={e => set(key, e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>
      ))}
      <SaveBtn onClick={() => updateContent('colors', form)} />
    </div>
  );
};

// ── Tab: Typography ────────────────────────────────────────────────────────

const TYPO_DEFAULTS = { headingFont: 'mono', bodySize: 'md', sectionSpacing: 'default' };

const TypographyTab = ({ content, updateContent }) => {
  const [form, setForm] = useState({ ...TYPO_DEFAULTS, ...content.typography });

  return (
    <div>
      <SectionTitle>Typography</SectionTitle>
      <p className="text-sm text-gray-400 mb-6">
        Controls heading font family, body text size, and section spacing. Changes apply after saving.
      </p>

      <div className="mb-7">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Heading Font Style
        </label>
        <SegmentedControl
          value={form.headingFont}
          onChange={v => setForm(f => ({ ...f, headingFont: v }))}
          options={[['mono', 'Monospace'], ['sans', 'Sans-Serif'], ['serif', 'Serif']]}
        />
        <p className="text-xs text-gray-600 mt-2">
          Monospace preserves the code-terminal style. Sans-Serif is clean modern. Serif is editorial.
        </p>
      </div>

      <div className="mb-7">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Body Text Size
        </label>
        <SegmentedControl
          value={form.bodySize}
          onChange={v => setForm(f => ({ ...f, bodySize: v }))}
          options={[['sm', 'Small 13px'], ['md', 'Default 15px'], ['lg', 'Large 17px']]}
        />
      </div>

      <div className="mb-7">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Section Spacing
        </label>
        <SegmentedControl
          value={form.sectionSpacing}
          onChange={v => setForm(f => ({ ...f, sectionSpacing: v }))}
          options={[['compact', 'Compact'], ['default', 'Default'], ['spacious', 'Spacious']]}
        />
      </div>

      <SaveBtn onClick={() => updateContent('typography', form)} />
    </div>
  );
};

// ── Tab: Visibility ────────────────────────────────────────────────────────

const VIS_DEFAULTS = { services: true, about: true, portfolio: true, stats: true, cta: true };

const VIS_SECTIONS = [
  { key: 'services',  label: 'Services / Expertise' },
  { key: 'about',     label: 'About' },
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'stats',     label: 'Stats' },
  { key: 'cta',       label: 'CTA / Call to Action' },
];

const VisibilityTab = ({ content, updateContent }) => {
  const [form, setForm] = useState({ ...VIS_DEFAULTS, ...content.visibility });

  return (
    <div>
      <SectionTitle>Section Visibility</SectionTitle>
      <p className="text-sm text-gray-400 mb-6">
        Show or hide sections on the public homepage. Hero is always visible.
      </p>
      <div className="divide-y divide-gray-800">
        {VIS_SECTIONS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-gray-200">{label}</p>
              <p className="text-xs text-gray-600 mt-0.5">
                {form[key] ? 'Visible on homepage' : 'Hidden from homepage'}
              </p>
            </div>
            <ToggleSwitch value={form[key]} onChange={v => setForm(f => ({ ...f, [key]: v }))} />
          </div>
        ))}
      </div>
      <div className="mt-6">
        <SaveBtn onClick={() => updateContent('visibility', form)} />
      </div>
    </div>
  );
};

// ── Tab: Tracker ───────────────────────────────────────────────────────────

const TrackerTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/run/get_log.php?t=' + Date.now(), {
        cache: 'no-store',
        headers: session ? { Authorization: 'Bearer ' + session.access_token } : {},
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      setLogs(data);
    } catch {
      setError('Could not load logs. Check that get_log.php is deployed to /run/ on the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="font-mono">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-cyan-400/20">
        <h2 className="text-xl font-bold text-cyan-400 tracking-widest">[ VISITOR TRACKER ]</h2>
        <button onClick={fetchLogs}
          className="text-xs text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/10 px-3 py-1 rounded transition-colors">
          ↻ Refresh
        </button>
      </div>

      {loading && <p className="text-gray-500 text-sm animate-pulse">Loading logs...</p>}
      {error   && <p className="text-red-400 text-sm border border-red-400/20 bg-red-400/5 rounded-lg px-4 py-3">{error}</p>}

      {!loading && !error && (
        <>
          <p className="text-xs text-gray-600 mb-4">
            Total: <span className="text-cyan-400">{logs.length}</span> visits
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse min-w-[1500px]">
              <thead>
                <tr className="text-cyan-400 border-b border-cyan-400/30 uppercase tracking-widest">
                  <th className="text-left px-3 py-3 whitespace-nowrap w-[90px]">All-Time #</th>
                  <th className="text-left px-3 py-3 whitespace-nowrap w-[90px]">Daily #</th>
                  <th className="text-left px-3 py-3 whitespace-nowrap min-w-[140px]">IP Address</th>
                  <th className="text-left px-3 py-3 whitespace-nowrap min-w-[120px]">Flag</th>
                  <th className="text-left px-3 py-3 whitespace-nowrap min-w-[140px]">SOURCE</th>
                  <th className="text-left px-3 py-3 whitespace-nowrap min-w-[190px]">Date (PST)</th>
                  <th className="text-left px-3 py-3 whitespace-nowrap min-w-[140px]">Country</th>
                  <th className="text-left px-3 py-3 whitespace-nowrap min-w-[150px]">City</th>
                  <th className="text-left px-3 py-3 whitespace-nowrap min-w-[180px]">Path</th>
                  <th className="text-left px-3 py-3 whitespace-nowrap min-w-[140px]">Referrer</th>
                  <th className="text-left px-3 py-3 whitespace-nowrap min-w-[190px]">Device / Browser</th>
                  <th className="text-left px-3 py-3 whitespace-nowrap min-w-[220px]">UA Full</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={12} className="py-10 text-center text-gray-700">No visitors logged yet.</td>
                  </tr>
                )}
                {logs.map((log, i) => {
                  const rowClass = log.flag === 'BOT-LIKE'
                    ? 'bg-red-900/20 hover:bg-red-900/30'
                    : log.flag === 'HIGH REPEAT'
                      ? 'bg-orange-900/20 hover:bg-orange-900/30'
                      : log.flag === 'REPEAT'
                        ? 'bg-yellow-900/20 hover:bg-yellow-900/30'
                        : 'hover:bg-cyan-400/5';
                  const badgeClass = log.flag === 'BOT-LIKE'
                    ? 'bg-red-600/10 text-red-200 border border-red-600/20'
                    : log.flag === 'HIGH REPEAT'
                      ? 'bg-orange-600/10 text-orange-200 border border-orange-600/20'
                      : log.flag === 'REPEAT'
                        ? 'bg-yellow-600/10 text-yellow-200 border border-yellow-600/20'
                        : 'bg-emerald-600/10 text-emerald-200 border border-emerald-600/20';
                  const uaFullLabel = log.ua_full || '-';
                  const shortUA = uaFullLabel.length > 80 ? `${uaFullLabel.slice(0, 80)}...` : uaFullLabel;
                  const pathLabel = log.path || '-';
                  const shortPath = pathLabel.length > 50 ? `${pathLabel.slice(0, 50)}...` : pathLabel;

                  return (
                    <tr key={i} className={`${rowClass} border-b border-gray-800/60 transition-colors`}>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-400">{log.global}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-yellow-400 font-bold">{log.daily}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-white">{log.ip}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${badgeClass}`}>
                          {log.flag}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-indigo-200">{detectSourceLabel(log)}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-green-400">{formatPstDate(log.date)}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-300">{log.country}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-fuchsia-400">{log.city}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-cyan-200" title={pathLabel}>{shortPath}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-indigo-200" title={log.referrer_raw || log.referrer}>{log.referrer}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-500">{log.device}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-400" title={uaFullLabel}>{shortUA}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// ── Login screen ──────────────────────────────────────────────────────────

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <div className="font-mono text-sm mb-8">
          <span className="text-gray-600">&lt;</span>
          <span className="text-blue-400 font-bold">hakan.run</span>
          <span className="text-gray-600"> /&gt;</span>
          <span className="text-gray-400 ml-2">Control Room</span>
        </div>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
          </div>
          {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-lg transition-colors text-sm">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ── 2FA: post-login TOTP challenge gate ───────────────────────────────────

const MfaChallenge = ({ onVerified }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const verify = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.find(f => f.status === 'verified') || factors?.totp?.[0];
      if (!totp) { onVerified(); return; }
      const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId: totp.id });
      if (chErr) throw chErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: totp.id, challengeId: ch.id, code: code.trim(),
      });
      if (vErr) throw vErr;
      onVerified();
    } catch (err) {
      setError(err.message || 'Invalid code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <div className="font-mono text-sm mb-2">
          <span className="text-gray-600">&lt;</span>
          <span className="text-blue-400 font-bold">hakan.run</span>
          <span className="text-gray-600"> /&gt;</span>
          <span className="text-gray-400 ml-2">Two-Factor</span>
        </div>
        <p className="text-xs text-gray-500 mb-6">Enter the 6-digit code from your authenticator app.</p>
        <form onSubmit={verify}>
          <input
            type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*"
            maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            required autoFocus placeholder="000000"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-center text-lg tracking-[0.5em] font-mono text-white focus:outline-none focus:border-blue-500 mb-4" />
          {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
          <button type="submit" disabled={loading || code.length < 6}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-lg transition-colors text-sm mb-3">
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </form>
        <button onClick={() => supabase.auth.signOut()}
          className="w-full text-gray-500 hover:text-white text-xs transition-colors">
          Sign out
        </button>
      </div>
    </div>
  );
};

// ── Tab: 2FA enrollment / management ──────────────────────────────────────

const SecurityTab = () => {
  const [factors, setFactors] = useState([]);
  const [enrolling, setEnrolling] = useState(null);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors(data?.totp || []);
  };
  useEffect(() => { refresh(); }, []);

  const startEnroll = async () => {
    setMsg(null); setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      setEnrolling({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    } catch (err) { setMsg({ type: 'err', text: err.message }); }
    finally { setLoading(false); }
  };

  const confirmEnroll = async (e) => {
    e.preventDefault();
    setMsg(null); setLoading(true);
    try {
      const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId: enrolling.id });
      if (chErr) throw chErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: enrolling.id, challengeId: ch.id, code: code.trim(),
      });
      if (vErr) throw vErr;
      setEnrolling(null); setCode('');
      setMsg({ type: 'ok', text: '2FA is now enabled on your account.' });
      refresh();
    } catch (err) { setMsg({ type: 'err', text: err.message || 'Invalid code.' }); }
    finally { setLoading(false); }
  };

  const remove = async (id) => {
    setLoading(true); setMsg(null);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
      if (error) throw error;
      setMsg({ type: 'ok', text: 'Factor removed.' });
      refresh();
    } catch (err) { setMsg({ type: 'err', text: err.message }); }
    finally { setLoading(false); }
  };

  const verified = factors.filter(f => f.status === 'verified');

  return (
    <div>
      <SectionTitle>Two-Factor Authentication</SectionTitle>

      {msg && (
        <p className={`text-sm mb-4 rounded-lg px-4 py-3 border ${
          msg.type === 'ok'
            ? 'text-emerald-300 border-emerald-500/20 bg-emerald-500/5'
            : 'text-red-300 border-red-500/20 bg-red-500/5'}`}>{msg.text}</p>
      )}

      {verified.length > 0 ? (
        <CardBox>
          <p className="text-sm text-emerald-300 mb-3">✓ 2FA is enabled ({verified.length} authenticator).</p>
          {verified.map(f => (
            <div key={f.id} className="flex items-center justify-between py-2 border-t border-gray-800 first:border-0">
              <span className="text-xs text-gray-400 font-mono">{f.friendly_name || 'Authenticator'} · {f.id.slice(0, 8)}…</span>
              <button onClick={() => remove(f.id)} disabled={loading}
                className="text-red-400 hover:text-red-300 text-xs">Remove</button>
            </div>
          ))}
        </CardBox>
      ) : enrolling ? (
        <CardBox>
          <p className="text-sm text-gray-300 mb-3">1. Scan this QR in Google Authenticator / Authy:</p>
          {enrolling.qr && <img src={enrolling.qr} alt="2FA QR code" className="bg-white p-2 rounded-lg mb-3" width={180} height={180} />}
          <p className="text-xs text-gray-500 mb-4 break-all">Or enter this secret manually: <span className="text-gray-300 font-mono">{enrolling.secret}</span></p>
          <form onSubmit={confirmEnroll}>
            <p className="text-sm text-gray-300 mb-2">2. Enter the 6-digit code to confirm:</p>
            <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
              value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} required placeholder="000000"
              className="w-40 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-center tracking-[0.4em] font-mono text-white focus:outline-none focus:border-blue-500 mb-3" />
            <div className="flex gap-2">
              <button type="submit" disabled={loading || code.length < 6}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-lg text-sm">
                {loading ? 'Confirming…' : 'Enable 2FA'}
              </button>
              <button type="button" onClick={() => { setEnrolling(null); setCode(''); }}
                className="text-gray-400 hover:text-white px-4 py-2 text-sm">Cancel</button>
            </div>
          </form>
        </CardBox>
      ) : (
        <CardBox>
          <p className="text-sm text-gray-400 mb-4">Protect the Control Room with a time-based code from your phone. Free — works with Google Authenticator, Authy, 1Password, etc.</p>
          <button onClick={startEnroll} disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-lg text-sm">
            {loading ? 'Starting…' : 'Set up 2FA'}
          </button>
        </CardBox>
      )}
    </div>
  );
};


// ── Main Admin (Control Room) page ────────────────────────────────────────

const Admin = () => {
  const [activeTab, setActiveTab] = useState('Hero');
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mfaOk, setMfaOk] = useState(true);
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 768);
  const { content, updateContent } = useContent();
  const tabProps = { content, updateContent };

  const checkMfa = async () => {
    try {
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      // Block only when a factor is enrolled (nextLevel aal2) but this session is still aal1.
      setMfaOk(!(data && data.nextLevel === 'aal2' && data.currentLevel === 'aal1'));
    } catch { setMfaOk(true); }
  };

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session) checkMfa();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (session) checkMfa(); else setMfaOk(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-500 text-sm font-mono">Loading…</p>
    </div>
  );

  if (!session) return <LoginScreen />;
  if (!mfaOk) return <MfaChallenge onVerified={() => setMfaOk(true)} />;

  const renderTab = () => {
    switch (activeTab) {
      case 'Hero':       return <HeroTab       {...tabProps} />;
      case 'Services':   return <ServicesTab   {...tabProps} />;
      case 'About':      return <AboutTab      {...tabProps} />;
      case 'Portfolio':  return <PortfolioTab  {...tabProps} />;
      case 'Stats':      return <StatsTab      {...tabProps} />;
      case 'CTA':        return <CTATab        {...tabProps} />;
      case 'Contact':    return <ContactTab    {...tabProps} />;
      case 'Footer':     return <FooterTab     {...tabProps} />;
      case 'Colors':     return <ColorsTab     {...tabProps} />;
      case 'Typography': return <TypographyTab {...tabProps} />;
      case 'Visibility': return <VisibilityTab {...tabProps} />;
      case 'Tracker':    return <TrackerTab />;
      case '2FA':        return <SecurityTab />;
      default:           return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">

      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-12' : 'w-48'} bg-gray-900 border-r border-gray-800 flex flex-col shrink-0 overflow-y-auto sticky top-0 h-screen self-start transition-all duration-200`}>

        {/* Toggle button */}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex items-center justify-center h-10 w-full text-gray-500 hover:text-white hover:bg-gray-800 transition-colors text-base border-b border-gray-800 shrink-0"
        >
          {collapsed ? '»' : '«'}
        </button>

        <div className={`flex flex-col flex-1 overflow-y-auto gap-0.5 ${collapsed ? 'p-1.5' : 'p-3'}`}>

          {/* Brand */}
          {!collapsed && (
            <div className="font-mono text-xs mb-5 px-2 pt-1">
              <span className="text-gray-600">&lt;</span>
              <span className="text-blue-400 font-bold">hakan.run</span>
              <span className="text-gray-600"> /&gt;</span>
            </div>
          )}

          {TAB_GROUPS.map(group => (
            <div key={group.label} className="mb-3">
              {!collapsed && (
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-2 mb-1">
                  {group.label}
                </p>
              )}
              {group.tabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  title={collapsed ? tab : undefined}
                  className={`w-full py-1.5 rounded-lg font-medium transition-colors ${
                    collapsed
                      ? 'text-center text-[10px] px-0'
                      : 'text-left text-sm px-3'
                  } ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {collapsed ? tab.slice(0, 2).toUpperCase() : tab}
                </button>
              ))}
            </div>
          ))}

          <div className="mt-auto pt-3 border-t border-gray-800 flex flex-col gap-1.5">
            {collapsed ? (
              <>
                <Link to="/" title="Back to Site"
                  className="text-gray-500 hover:text-gray-300 transition-colors text-center text-base py-1 block">
                  ←
                </Link>
                <button onClick={() => supabase.auth.signOut()} title="Sign Out"
                  className="text-gray-500 hover:text-red-400 transition-colors text-center text-base py-1 w-full">
                  ⏻
                </button>
              </>
            ) : (
              <>
                <Link to="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2">
                  ← Back to Site
                </Link>
                <button onClick={() => supabase.auth.signOut()}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors text-left px-2">
                  Sign Out
                </button>
              </>
            )}
          </div>

        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto min-w-0">
        {renderTab()}
      </main>
    </div>
  );
};

export default Admin;
