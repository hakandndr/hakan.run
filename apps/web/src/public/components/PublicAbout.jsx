import React from 'react';
import { motion } from 'framer-motion';

const viewport = { once: true, amount: 0.15 };
const transition = { duration: 0.65, ease: 'easeOut' };

const Story = ({ sections }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={viewport}
    transition={transition}
    className="space-y-10"
  >
    {sections.map((section, index) => (
      <div key={`${section.title}-${index}`} className="relative pl-6 border-l-2 border-[#57B8FF]/20">
        {section.period && (
          <span className="font-mono text-[10px] text-[#57B8FF]/50 uppercase tracking-widest block mb-1">
            {section.period}
          </span>
        )}
        <h3 className="font-mono text-sm font-bold text-[#F4F4F5] mb-3">{section.title}</h3>
        <p className="text-[15px] text-[#A1A1AA] leading-[1.7]">{section.body}</p>
      </div>
    ))}
  </motion.div>
);

const Portrait = ({ image, imageAlt, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={viewport}
    transition={{ ...transition, delay }}
  >
    <div
      className="w-full max-w-[240px] sm:max-w-[280px] lg:max-w-[320px] mx-auto lg:mx-0 rounded-2xl overflow-hidden border border-white/[0.08]"
      style={{ backgroundColor: '#111112' }}
    >
      <img src={image} alt={imageAlt} className="w-full object-cover object-top block" style={{ aspectRatio: '4/5' }} />
    </div>
  </motion.div>
);

const PublicAbout = ({ about }) => {
  const { block1, block2, chips } = about;
  const block2Visible = block2.visible !== false;

  return (
    <section
      id="about"
      data-public-section="about"
      className="relative overflow-hidden py-24 border-t border-white/[0.06]"
      style={{ backgroundColor: '#0B0B0C' }}
    >
      <div className="container mx-auto px-6">
        <div className="mb-14">
          <span className="font-mono text-xs text-[#57B8FF]/60 uppercase tracking-widest">Background</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white uppercase font-mono tracking-tight mt-2">
            {block1.heading} <span className="text-[#57B8FF]">{block1.headingAccent}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:items-center">
          <Story sections={block1.sections} />
          <div>
            <Portrait image={block1.image} imageAlt={block1.imageAlt} delay={0.12} />
            <div className="flex flex-wrap gap-2 mt-4 max-w-[320px] mx-auto lg:mx-0">
              {chips.map((tag) => (
                <span
                  key={tag}
                  data-about-chip
                  className="font-mono text-[10px] text-[#9CA3AF] px-2.5 py-1 border border-white/[0.08] rounded bg-white/[0.02]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {block2Visible && (
          <>
            <div className="mt-20 mb-14">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white uppercase font-mono tracking-tight">
                {block2.heading} <span className="text-[#57B8FF]">{block2.headingAccent}</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:items-center">
              <Story sections={block2.sections} />
              <Portrait image={block2.image} imageAlt={block2.imageAlt} delay={0.12} />
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default PublicAbout;
