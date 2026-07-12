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
        <title>Hakan Dundar | Software Developer &amp; QA Automation Engineer</title>
        <meta name="description" content="Professional Software Developer based in California. Specializing in clean code, robust automation frameworks, and high-performance technical solutions." />
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
