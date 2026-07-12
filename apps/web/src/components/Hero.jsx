import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useContent } from '@/contexts/ContentContext';

const Hero = () => {
  const navigate = useNavigate();
  const { content } = useContent();
  const h = content.hero;
  const socialLinks = content.contact?.socialLinks || [];

  const handlePrimaryClick = () => {
    const href = h.primaryButtonHref || '#portfolio';
    if (href.startsWith('http')) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else if (href.startsWith('#')) {
      const el = document.getElementById(href.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(href);
    }
  };

  const handleSecondaryClick = () => {
    const href = h.secondaryButtonHref || '/contact';
    if (href.startsWith('http')) window.open(href, '_blank', 'noopener,noreferrer');
    else navigate(href);
  };

  const BIO = "I'm Hakan Dundar. I spent 15 years in Turkey working across IT infrastructure, education technology, and large-scale technical operations. After moving to the United States with a Green Card, I shifted my focus into software development, QA automation, and cloud-ready web applications. Based in Irvine, California, I combine systems thinking, clean code, and automation-first engineering to build reliable products that actually run in production.";

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden pt-20 border-b border-white/[0.06]"
      style={{ backgroundColor: '#090909' }}
    >
      <div className="w-full px-6 py-20 lg:py-0 lg:min-h-screen lg:flex lg:items-center">
        {/* Constrained two-column wrapper */}
        <div className="max-w-[1120px] mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_360px] gap-6 lg:gap-8 items-center">

            {/* ── LEFT: text content ── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75 }}
            >
              {/* Badge – terminal style */}
              <div className="inline-flex items-center gap-0 px-3 py-1.5 mb-8 border border-[#2a3a50] rounded-md bg-[#0d1117] max-w-full">
                <span className="font-mono text-xs text-[#57B8FF]/60 shrink-0 select-none mr-2">&gt;_ $</span>
                <span className="font-mono text-xs text-[#57B8FF] tracking-wide truncate">Software Developer</span>
                <span className="font-mono text-xs text-[#57B8FF] ml-1 shrink-0 animate-[terminalCursorSlow_1.4s_ease-in-out_infinite]">█</span>
              </div>
              <style>{`@keyframes terminalCursorSlow{0%,100%{opacity:1}50%{opacity:0.28}}`}</style>

              {/* Heading */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-[88px] font-bold mb-8 leading-[1.05] text-white uppercase font-mono tracking-tight">
                {h.headingLine1}
                <span className="block text-[#57B8FF]">{h.headingLine2}</span>
              </h1>

              {/* Bio */}
              <div className="mb-10 max-w-lg">
                <p className="text-[17px] text-[#A1A1AA] leading-[1.75]">
                  {BIO}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap gap-3 mb-8">
                <Button
                  onClick={handlePrimaryClick}
                  size="lg"
                  className="bg-[#57B8FF] hover:bg-[#57B8FF]/90 text-[#090909] font-mono font-bold px-7 py-6 text-sm rounded group"
                >
                  {h.primaryButton}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  onClick={handleSecondaryClick}
                  size="lg"
                  variant="outline"
                  className="border border-white/15 hover:border-white/25 hover:bg-white/[0.04] text-[#F4F4F5] font-mono px-7 py-6 text-sm rounded bg-transparent"
                >
                  {h.secondaryButton}
                </Button>
              </div>

              {/* Social links */}
              {socialLinks.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {socialLinks.map(link => (
                    link.url ? (
                      <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 font-mono text-[13px] text-[#6B7280] border border-white/[0.10] rounded hover:border-[#57B8FF]/40 hover:text-[#57B8FF] transition-all duration-200 bg-transparent"
                      >
                        {link.name}
                      </a>
                    ) : null
                  ))}
                </div>
              )}
            </motion.div>

            {/* ── RIGHT: portrait photo ── */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.85, delay: 0.18 }}
              className="hidden lg:flex justify-center lg:justify-end"
            >
              <div className="relative w-full max-w-[300px] lg:max-w-[320px] xl:max-w-[340px]">
                {/* Badge A — top-left */}
                <div className="absolute top-6 -left-5 z-20 bg-[#181818] border border-white/[0.12] rounded-xl px-3 py-2.5 shadow-xl">
                  <p className="font-mono text-[22px] font-bold text-white leading-tight">15+</p>
                  <p className="text-[11px] text-[#9CA3AF] tracking-wide whitespace-nowrap mt-0.5">Years in Tech</p>
                </div>

                {/* Badge B — bottom-right */}
                <div className="absolute bottom-6 -right-3 z-20 bg-[#181818] border border-white/[0.12] rounded-xl px-3 py-2.5 shadow-xl text-right">
                  <p className="text-[11px] text-[#9CA3AF] tracking-wide whitespace-nowrap">US Software</p>
                  <p className="font-mono text-sm font-bold text-white whitespace-nowrap mt-0.5">QA Automation</p>
                </div>

                {/* Ambient glow */}
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse at 50% 30%, rgba(87,184,255,0.07) 0%, transparent 70%)',
                    transform: 'scale(1.1)',
                  }}
                />
                {/* Photo card */}
                <div
                  className="relative rounded-2xl overflow-hidden border border-white/[0.1]"
                  style={{ backgroundColor: '#111112' }}
                >
                  <img
                    src="/media/HakanDundar.webp"
                    alt="Hakan Dundar"
                    className="w-full object-cover object-top block"
                    style={{ aspectRatio: '4/5' }}
                  />
                  {/* Name overlay */}
                  <div className="absolute bottom-0 left-0 right-0 px-5 py-4 bg-gradient-to-t from-black/75 via-black/30 to-transparent">
                    <p className="font-mono text-xs font-bold text-white/80 uppercase tracking-widest">Hakan Dundar</p>
                    <p className="font-mono text-[10px] text-white/40 mt-0.5">Software Developer · Irvine, CA</p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
