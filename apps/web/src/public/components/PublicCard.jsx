import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowDownToLine, ArrowUpRight, Briefcase, Github, Linkedin, Mail } from 'lucide-react';
import { useCanonicalUrl } from '@/head/useCanonicalUrl';
import usePublicNavigation from '@/hooks/usePublicNavigation';
import {
  CARD_PRODUCT_CONFIG,
  createCardModel,
  createVCardDownload,
} from '@/public/card/card-model';

const ACTION_ICONS = {
  portfolio: Briefcase,
  linkedin: Linkedin,
  github: Github,
  email: Mail,
};

const CardBrandMark = () => (
  <span
    data-card-brand-mark
    role="img"
    aria-label="hakan.run brand mark"
    className="inline-flex items-baseline font-mono text-2xl font-bold tracking-[-0.08em]"
  >
    <span aria-hidden="true" className="text-[#57B8FF]">&lt;h</span>
    <span aria-hidden="true" data-card-logo-slash className="text-white">/</span>
    <span aria-hidden="true" className="text-[#57B8FF]">&gt;</span>
  </span>
);

const ActionTile = ({ action }) => {
  const Icon = ACTION_ICONS[action.id];
  const navigateTo = usePublicNavigation();
  const internal = !action.external;

  const handleClick = (event) => {
    if (!internal) return;
    event.preventDefault();
    navigateTo(action.href, { behavior: action.href.includes('#') ? 'smooth' : 'auto' });
  };

  return (
    <a
      data-card-action={action.id}
      href={action.href}
      onClick={handleClick}
      target={action.newWindow ? '_blank' : undefined}
      rel={action.newWindow ? 'noopener noreferrer' : undefined}
      className="group min-h-[68px] rounded-xl border border-white/[0.09] bg-white/[0.025] px-4 py-3.5 flex items-center gap-3 hover:border-[#57B8FF]/40 hover:bg-[#57B8FF]/[0.055] focus-visible:border-[#57B8FF]/60 transition-colors"
    >
      <span className="h-10 w-10 shrink-0 rounded-lg border border-[#57B8FF]/20 bg-[#57B8FF]/[0.07] flex items-center justify-center text-[#57B8FF]">
        <Icon aria-hidden="true" size={18} strokeWidth={1.7} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-sm font-bold text-[#F4F4F5]">{action.label}</span>
        <span className="block mt-0.5 truncate text-xs text-[#71717A]">{action.detail}</span>
      </span>
      <ArrowUpRight aria-hidden="true" size={16} className="shrink-0 text-[#52525B] group-hover:text-[#57B8FF] transition-colors" />
    </a>
  );
};

const PublicCard = ({ snapshot }) => {
  const navigateTo = usePublicNavigation();
  const card = createCardModel(snapshot);
  const vCard = createVCardDownload(card);
  const description = `Digital business card for ${card.identity.name}, ${card.identity.role}.`;
  useCanonicalUrl(CARD_PRODUCT_CONFIG.canonicalUrl);

  return (
    <motion.main
      data-public-section="card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="relative min-h-screen overflow-x-hidden bg-[#090909] text-white"
    >
      <Helmet>
        <title>{card.identity.name} — Digital Business Card</title>
        <meta name="description" content={description} />
      </Helmet>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(87,184,255,0.11),transparent_42%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#57B8FF]/60 to-transparent" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="w-full overflow-hidden rounded-2xl border border-white/[0.09] bg-[#101011] shadow-2xl shadow-black/30">
          <div className="grid lg:grid-cols-[0.88fr_1.12fr]">
            <section className="relative border-b border-white/[0.08] px-5 py-7 sm:px-8 sm:py-9 lg:border-b-0 lg:border-r lg:px-10 lg:py-12" aria-labelledby="card-name">
              <div aria-hidden="true" className="absolute left-0 top-10 hidden h-24 w-px bg-gradient-to-b from-transparent via-[#57B8FF] to-transparent lg:block" />

              <div className="flex items-center justify-between gap-4">
                <a
                  href="/"
                  onClick={(event) => {
                    event.preventDefault();
                    navigateTo('/');
                  }}
                  className="inline-flex items-center rounded focus-visible:outline-offset-4"
                  aria-label="Return to hakan.run"
                >
                  <CardBrandMark />
                </a>
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#52525B]">digital_card</span>
              </div>

              <div className="mt-9 flex items-center gap-5 lg:mt-14 lg:block">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/[0.12] bg-[#18181B] sm:h-28 sm:w-28 lg:h-36 lg:w-36">
                  <img
                    data-card-profile-image
                    src={card.identity.image}
                    alt={card.identity.imageAlt}
                    className="h-full w-full object-cover object-top"
                  />
                  <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-[#57B8FF]/70" />
                </div>

                <div className="min-w-0 lg:mt-7">
                  <p className="mb-2 font-mono text-xs uppercase tracking-[0.15em] text-[#57B8FF]/70">profile / available</p>
                  <h1 id="card-name" className="text-2xl font-bold leading-tight tracking-tight text-[#F4F4F5] sm:text-3xl lg:text-4xl">
                    {card.identity.name}
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA] sm:text-base">{card.identity.role}</p>
                  <p className="mt-1 font-mono text-xs leading-relaxed text-[#71717A]">{card.identity.location}</p>
                </div>
              </div>
            </section>

            <section className="px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-12" aria-labelledby="card-actions-title">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.15em] text-[#57B8FF]/70">connect / run</p>
                  <h2 id="card-actions-title" className="mt-2 font-mono text-xl font-bold uppercase tracking-tight text-[#F4F4F5] sm:text-2xl">
                    Contact channels
                  </h2>
                </div>
                <span aria-hidden="true" className="font-mono text-xs text-[#3F3F46]">
                  {String(card.actions.length).padStart(2, '0')} links
                </span>
              </div>

              <a
                data-card-add-contact
                href={vCard.href}
                download={vCard.fileName}
                type={vCard.mimeType}
                aria-label={`Add ${card.identity.name} to contacts by downloading a vCard`}
                className="group mt-7 flex min-h-[64px] w-full items-center justify-center gap-3 rounded-xl bg-[#57B8FF] px-5 py-4 font-mono text-sm font-bold text-[#090909] hover:bg-[#7BC8FF] focus-visible:outline-white transition-colors"
              >
                <ArrowDownToLine aria-hidden="true" size={19} />
                Add to Contacts
                <span aria-hidden="true" className="opacity-45 transition-transform group-hover:translate-y-0.5">.vcf</span>
              </a>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {card.actions.map((action) => <ActionTile key={action.id} action={action} />)}
              </div>

              <div className="mt-8 flex items-center justify-between gap-4 border-t border-white/[0.07] pt-5">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#A1A1AA]">{card.slogan}</p>
                <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-[#57B8FF] shadow-[0_0_16px_rgba(87,184,255,0.65)]" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </motion.main>
  );
};

export default PublicCard;
