import React from 'react';
import { Helmet } from 'react-helmet';
import Hero from '@/components/Hero';
import Stats from '@/components/Stats';
import Services from '@/components/Services';
import About from '@/components/About';
import Portfolio from '@/components/Portfolio';
import CTA from '@/components/CTA';
import SectionAnimator from '@/components/SectionAnimator';
import { useContent } from '@/contexts/ContentContext';

const Home = () => {
  const { content } = useContent();
  const vis = content.visibility ?? {};

  return (
    <>
      <Helmet>
        <title>{content.header.siteName}</title>
        <meta name="description" content={content.hero.paragraph} />
      </Helmet>
      <Hero />
      {vis.stats    !== false && <SectionAnimator><Stats /></SectionAnimator>}
      {vis.services !== false && <SectionAnimator><Services /></SectionAnimator>}
      {vis.portfolio !== false && <SectionAnimator><Portfolio /></SectionAnimator>}
      {vis.about    !== false && <About />}
      {vis.cta      !== false && <SectionAnimator><CTA /></SectionAnimator>}
    </>
  );
};

export default Home;
