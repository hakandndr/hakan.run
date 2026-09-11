import React from 'react';
import { Helmet } from 'react-helmet';
import SectionAnimator from '@/components/SectionAnimator';
import PublicAbout from '@/public/components/PublicAbout';
import PublicCTA from '@/public/components/PublicCTA';
import PublicExpertise from '@/public/components/PublicExpertise';
import PublicHero from '@/public/components/PublicHero';
import PublicPortfolio from '@/public/components/PublicPortfolio';
import PublicStats from '@/public/components/PublicStats';

const PublicHome = ({ snapshot }) => {
  const { content } = snapshot;
  const { visibility } = content;

  return (
    <>
      <Helmet>
        <title>{content.header.siteName}</title>
        <meta name="description" content={content.hero.paragraph} />
      </Helmet>
      <PublicHero hero={content.hero} socialLinks={content.contact.socialLinks} />
      {visibility.stats !== false && <SectionAnimator><PublicStats stats={content.stats} /></SectionAnimator>}
      {visibility.services !== false && (
        <SectionAnimator><PublicExpertise services={content.services} /></SectionAnimator>
      )}
      {visibility.portfolio !== false && (
        <SectionAnimator><PublicPortfolio portfolio={content.portfolio} /></SectionAnimator>
      )}
      {visibility.about !== false && <PublicAbout about={content.about} />}
      {visibility.cta !== false && <SectionAnimator><PublicCTA cta={content.cta} /></SectionAnimator>}
    </>
  );
};

export default PublicHome;
