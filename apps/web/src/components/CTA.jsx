import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useContent } from '@/contexts/ContentContext';

const CTA = () => {
  const navigate = useNavigate();
  const { content } = useContent();
  const c = content.cta;

  const handleCTAClick = () => navigate(c.buttonHref || '/contact');

  return (
    <section
      id="cta"
      className="relative py-28 overflow-hidden border-t border-white/[0.06]"
      style={{ backgroundColor: '#090909' }}
    >
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight uppercase font-mono tracking-tight">
            {c.heading}{' '}
            <span className="text-[#57B8FF]">{c.headingAccent}</span>
            {c.headingSuffix}
          </h2>

          <p className="text-[15px] text-[#A1A1AA] mb-10 max-w-xl mx-auto leading-[1.7]">
            {c.paragraph}
          </p>

          <Button
            onClick={handleCTAClick}
            size="lg"
            className="bg-[#57B8FF] hover:bg-[#57B8FF]/90 text-[#090909] font-mono font-bold px-10 py-7 text-base rounded group"
          >
            {c.button}
            <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </Button>

        </div>
      </div>
    </section>
  );
};

export default CTA;
