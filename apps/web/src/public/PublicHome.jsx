import React from 'react';
import { Helmet } from 'react-helmet';
import SectionAnimator from '@/components/SectionAnimator';
import PublicAbout from '@/public/components/PublicAbout';
import PublicCTA from '@/public/components/PublicCTA';
import PublicExpertise from '@/public/components/PublicExpertise';
import PublicHero from '@/public/components/PublicHero';
import PublicPortfolio from '@/public/components/PublicPortfolio';
import PublicStats from '@/public/components/PublicStats';
import { NotesHomeSection } from '@/notes/NotesPages';
import { publicCanonicalUrl, SOCIAL_IMAGE } from '@/head/document-head';

const PublicHome = ({ snapshot }) => {
  const { content } = snapshot;
  const { visibility } = content;
  // The page title and description are published content; the social tags
  // repeat them so link previews describe the same page.
  const title = content.header.siteName;
  const description = content.hero.paragraph;

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={title} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={publicCanonicalUrl('/')} />
        <meta property="og:image" content={SOCIAL_IMAGE.url} />
        <meta property="og:image:width" content={String(SOCIAL_IMAGE.width)} />
        <meta property="og:image:height" content={String(SOCIAL_IMAGE.height)} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={SOCIAL_IMAGE.url} />
      </Helmet>
      <PublicHero hero={content.hero} socialLinks={content.contact.socialLinks} />
      {visibility.stats !== false && <SectionAnimator><PublicStats stats={content.stats} /></SectionAnimator>}
      {visibility.services !== false && (
        <SectionAnimator><PublicExpertise services={content.services} /></SectionAnimator>
      )}
      {visibility.portfolio !== false && (
        <SectionAnimator><PublicPortfolio portfolio={content.portfolio} /></SectionAnimator>
      )}
      <NotesHomeSection />
      {visibility.about !== false && <PublicAbout about={content.about} />}
      {visibility.cta !== false && <SectionAnimator><PublicCTA cta={content.cta} /></SectionAnimator>}
    </>
  );
};

export default PublicHome;
