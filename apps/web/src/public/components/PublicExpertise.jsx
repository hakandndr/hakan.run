import React, { useState } from 'react';

const PublicExpertise = ({ services }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const toggle = (index) => {
    setActiveIndex((current) => current === index ? null : index);
  };

  return (
    <section
      id="services"
      className="relative overflow-hidden py-24 border-t border-white/[0.06]"
      style={{ backgroundColor: '#0E0E0F' }}
      data-public-section="expertise"
    >
      <div className="container mx-auto px-6">
        <div className="mb-16">
          <div className="flex items-center gap-2 font-mono text-xs text-gray-600 mb-5">
            <span className="text-accent-purple select-none">❯</span>
            <span>ls -la ./expertise</span>
            <span className="animate-pulse text-accent-purple select-none">▋</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight text-white uppercase font-mono tracking-tight">
            {services.heading} <span className="text-accent-purple">{services.headingAccent}</span>
          </h2>

          <p className="text-gray-500 max-w-3xl mt-4 text-[15px] leading-relaxed">
            <span className="text-gray-700 select-none">{'// '}</span>
            {services.subtitle}
          </p>

          <div className="flex flex-wrap gap-2 mt-8">
            {services.filterTags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 font-mono text-xs text-accent-purple/70 border border-accent-purple/20 bg-accent-purple/5 rounded"
              >
                --{tag.toLowerCase().replace(/\s+/g, '-')}
              </span>
            ))}
          </div>
        </div>

        <div
          className="border border-white/[0.08] rounded-xl overflow-hidden"
          style={{ backgroundColor: '#111112' }}
          data-expertise-processes
        >
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06]" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-8 font-mono text-[10px] tracking-widest text-gray-700 uppercase">
              <span>PID</span>
              <span>PROCESS</span>
            </div>
            <span className="font-mono text-[10px] tracking-widest text-gray-700 uppercase">STATUS</span>
          </div>

          {services.items.map((service, index) => {
            const isActive = activeIndex === index;
            const panelId = `expertise-process-${index}`;

            return (
              <div key={`${index}-${service.title}`} className="border-b border-white/[0.06] last:border-0" data-expertise-row>
                <button
                  type="button"
                  className="flex justify-between items-center cursor-pointer px-6 py-5 group hover:bg-white/[0.02] transition-colors w-full text-left"
                  onClick={() => toggle(index)}
                  aria-expanded={isActive}
                  aria-controls={panelId}
                >
                  <span className="flex items-center gap-5 min-w-0">
                    <span className="font-mono text-xs text-gray-700 w-5 shrink-0 select-none">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={`font-mono text-xl md:text-3xl font-bold transition-colors duration-300 ${
                        isActive ? 'text-accent-purple' : 'text-gray-500 group-hover:text-white'
                      }`}
                      data-expertise-process
                    >
                      {service.title}
                    </span>
                  </span>

                  <span className="flex items-center gap-4 shrink-0">
                    <span
                      className={`inline font-mono text-[10px] px-2 py-0.5 rounded border tracking-widest transition-colors duration-300 ${
                        isActive
                          ? 'text-green-400 border-green-400/30 bg-green-400/5'
                          : 'text-gray-700 border-white/[0.08]'
                      }`}
                      data-expertise-status
                    >
                      {isActive ? 'RUNNING' : 'IDLE'}
                    </span>
                    <span
                      className={`font-mono text-accent-purple text-xl leading-none select-none transition-transform duration-300 ${
                        isActive ? 'rotate-45' : 'rotate-0'
                      }`}
                      aria-hidden="true"
                      data-expertise-toggle
                    >
                      +
                    </span>
                  </span>
                </button>

                <div
                  id={panelId}
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                    isActive ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                  aria-hidden={!isActive}
                  data-expertise-description
                >
                  <div className="overflow-hidden">
                    <div className="pb-6 ml-6 pl-8 pr-6 border-l border-accent-purple/20">
                      <p className="text-[15px] text-gray-400 leading-[1.7]">
                        <span className="text-gray-700 mr-2 select-none">{'>'}</span>
                        {service.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PublicExpertise;
