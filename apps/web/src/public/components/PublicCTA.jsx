import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import usePublicNavigation from '@/hooks/usePublicNavigation';

const PublicCTA = ({ cta }) => {
  const navigateTo = usePublicNavigation();

  return (
    <section
      id="cta"
      data-public-section="cta"
      className="relative py-28 overflow-hidden border-t border-white/[0.06]"
      style={{ backgroundColor: '#090909' }}
    >
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight uppercase font-mono tracking-tight">
            {cta.heading}{' '}
            <span className="text-[#57B8FF]">{cta.headingAccent}</span>
            {cta.headingSuffix}
          </h2>
          <p className="text-[15px] text-[#A1A1AA] mb-10 max-w-xl mx-auto leading-[1.7]">{cta.paragraph}</p>
          <Button
            onClick={() => navigateTo(cta.buttonHref)}
            size="lg"
            className="bg-[#57B8FF] hover:bg-[#57B8FF]/90 text-[#090909] font-mono font-bold px-10 py-7 text-base rounded group"
          >
            {cta.button}
            <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PublicCTA;
