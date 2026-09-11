import React from 'react';
import { Helmet } from 'react-helmet';
import About from '@/components/About';
import CTA from '@/components/CTA';
import Portfolio from '@/components/Portfolio';
import SectionAnimator from '@/components/SectionAnimator';
import Stats from '@/components/Stats';
import PublicExpertise from '@/public/components/PublicExpertise';
import PublicHero from '@/public/components/PublicHero';

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
      {visibility.stats !== false && <SectionAnimator><Stats /></SectionAnimator>}
      {visibility.services !== false && (
        <SectionAnimator><PublicExpertise services={content.services} /></SectionAnimator>
      )}
      {visibility.portfolio !== false && <SectionAnimator><Portfolio /></SectionAnimator>}
      {visibility.about !== false && <About />}
      {visibility.cta !== false && <SectionAnimator><CTA /></SectionAnimator>}
    </>
  );
};

export default PublicHome;
