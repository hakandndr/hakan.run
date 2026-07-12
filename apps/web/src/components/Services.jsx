import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContent } from '@/contexts/ContentContext';

const Services = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { content } = useContent();
  const s = content.services;

  const handleServiceClick = index => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section
      id="services"
      className="relative overflow-hidden py-24 border-t border-white/[0.06]"
      style={{ backgroundColor: '#0E0E0F' }}
    >
      <div className="container mx-auto px-6">

        {/* Section header */}
        <div className="mb-16">
          <div className="flex items-center gap-2 font-mono text-xs text-gray-600 mb-5">
            <span className="text-accent-purple select-none">❯</span>
            <span>ls -la ./expertise</span>
            <span className="animate-pulse text-accent-purple select-none">▋</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight text-white uppercase font-mono tracking-tight">
            {s.heading} <span className="text-accent-purple">{s.headingAccent}</span>
          </h2>

          <p className="text-gray-500 max-w-3xl mt-4 text-[15px] leading-relaxed">
            <span className="text-gray-700 select-none">{'// '}</span>
            {s.subtitle}
          </p>

          <div className="flex flex-wrap gap-2 mt-8">
            {s.filterTags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 font-mono text-xs text-accent-purple/70 border border-accent-purple/20 bg-accent-purple/5 rounded"
              >
                --{tag.toLowerCase().replace(/\s+/g, '-')}
              </span>
            ))}
          </div>
        </div>

        {/* Terminal process panel */}
        <div
          className="border border-white/[0.08] rounded-xl overflow-hidden"
          style={{ backgroundColor: '#111112' }}
        >
          {/* Column header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06]" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-8 font-mono text-[10px] tracking-widest text-gray-700 uppercase">
              <span>PID</span>
              <span>PROCESS</span>
            </div>
            <span className="font-mono text-[10px] tracking-widest text-gray-700 uppercase">STATUS</span>
          </div>

          {s.items.map((service, index) => (
            <div key={service.title} className="border-b border-white/[0.06] last:border-0">
              <div
                className="flex justify-between items-center cursor-pointer px-6 py-5 group hover:bg-white/[0.02] transition-colors"
                onClick={() => handleServiceClick(index)}
              >
                <div className="flex items-center gap-5 min-w-0">
                  <span className="font-mono text-xs text-gray-700 w-5 shrink-0 select-none">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3
                    className={`font-mono text-xl md:text-3xl font-bold transition-colors duration-300 ${
                      activeIndex === index
                        ? 'text-accent-purple'
                        : 'text-gray-500 group-hover:text-white'
                    }`}
                  >
                    {service.title}
                  </h3>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span
                    className={`inline font-mono text-[10px] px-2 py-0.5 rounded border tracking-widest transition-colors duration-300 ${
                      activeIndex === index
                        ? 'text-green-400 border-green-400/30 bg-green-400/5'
                        : 'text-gray-700 border-white/[0.08]'
                    }`}
                  >
                    {activeIndex === index ? 'RUNNING' : 'IDLE'}
                  </span>
                  <motion.span
                    className="font-mono text-accent-purple text-xl leading-none select-none"
                    animate={{ rotate: activeIndex === index ? 45 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    +
                  </motion.span>
                </div>
              </div>

              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pb-6 ml-6 pl-8 pr-6 border-l border-accent-purple/20">
                      <p className="text-[15px] text-gray-400 leading-[1.7]">
                        <span className="text-gray-700 mr-2 select-none">{'>'}</span>
                        {service.description}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Services;
