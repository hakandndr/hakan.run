const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CARD_PRODUCT_CONFIG = Object.freeze({
  route: '/card',
  canonicalUrl: 'https://hakan.run/card',
  siteUrl: 'https://hakan.run/',
});

const deepFreeze = (value) => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
};

const normalizeName = (value) => value.toLowerCase().replace(/[^a-z]/g, '');

const findNamedLink = (links, name) =>
  links.find((link) => normalizeName(link.name) === normalizeName(name));

const findPublishedEmail = (contact) =>
  contact.infoBlocks
    .flatMap((block) => block.lines)
    .find((line) => EMAIL_PATTERN.test(line));

const vCardEscape = (value) => String(value)
  .replace(/\\/g, '\\\\')
  .replace(/\r?\n/g, '\\n')
  .replace(/;/g, '\\;')
  .replace(/,/g, '\\,');

const fileSlug = (value) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

export const createCardModel = (snapshot) => {
  const { header, hero, contact } = snapshot.content;
  const portfolio = findNamedLink(header.navLinks, 'Portfolio');
  const linkedIn = findNamedLink(contact.socialLinks, 'LinkedIn');
  const github = findNamedLink(contact.socialLinks, 'GitHub');
  const email = findPublishedEmail(contact);

  const actions = [
    portfolio && {
      id: 'portfolio',
      label: portfolio.name,
      detail: 'hakan.run',
      href: portfolio.href,
      external: false,
    },
    linkedIn && {
      id: 'linkedin',
      label: linkedIn.name,
      detail: new URL(linkedIn.url).hostname.replace(/^www\./, ''),
      href: linkedIn.url,
      external: true,
      newWindow: true,
    },
    github && {
      id: 'github',
      label: github.name,
      detail: new URL(github.url).hostname,
      href: github.url,
      external: true,
      newWindow: true,
    },
    email && {
      id: 'email',
      label: 'Email',
      detail: email,
      href: `mailto:${email}`,
      external: true,
      newWindow: false,
    },
  ].filter(Boolean);

  return deepFreeze({
    identity: {
      name: hero.profile.name,
      role: hero.profile.role,
      location: hero.profile.location,
      image: hero.profile.image,
      imageAlt: hero.profile.imageAlt,
    },
    slogan: `${hero.headingLine1} ${hero.headingLine2}`.trim(),
    email: email ?? null,
    linkedIn: linkedIn?.url ?? null,
    github: github?.url ?? null,
    actions,
  });
};

export const createVCard = (card) => {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:4.0',
    'KIND:individual',
    `FN:${vCardEscape(card.identity.name)}`,
    `TITLE:${vCardEscape(card.identity.role)}`,
  ];

  if (card.email) lines.push(`EMAIL;TYPE=work:${vCardEscape(card.email)}`);
  lines.push(`URL;TYPE=work:${CARD_PRODUCT_CONFIG.siteUrl}`);
  if (card.linkedIn) lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${card.linkedIn}`);
  if (card.github) lines.push(`X-SOCIALPROFILE;TYPE=github:${card.github}`);
  lines.push(`NOTE:${vCardEscape(card.slogan)}`, 'END:VCARD', '');

  return lines.join('\r\n');
};

export const createVCardDownload = (card) => {
  const text = createVCard(card);
  return Object.freeze({
    fileName: `${fileSlug(card.identity.name)}.vcf`,
    href: `data:text/vcard;charset=utf-8,${encodeURIComponent(text)}`,
    mimeType: 'text/vcard;charset=utf-8',
    text,
  });
};
