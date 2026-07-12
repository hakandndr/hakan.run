import React from 'react';
import { GitBranch, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useContent } from '@/contexts/ContentContext';
const LANG_STACK = [
  { dot: 'bg-blue-400',   label: 'TypeScript'     },
  { dot: 'bg-yellow-400', label: 'Playwright'      },
  { dot: 'bg-sky-400',    label: 'Windows Server'  },
  { dot: 'bg-green-400',  label: 'Node.js'         },
  { dot: 'bg-purple-400', label: 'Python'          },
  { dot: 'bg-orange-400', label: 'DevOps'          },
];

const Portfolio = () => {
  const navigate = useNavigate();
  const { content } = useContent();
  const p = content.portfolio;

  const handleProjectClick = (card) => {
    if (card.externalUrl) window.open(card.externalUrl, '_blank', 'noopener,noreferrer');
    else navigate(`/project/${card.slug}`);
  };

  return (
    <section id="portfolio" className="relative overflow-hidden py-24 border-t border-white/[0.06]" style={{ backgroundColor: '#0B0B0C' }}>
      <div className="container mx-auto px-6">

        {/* Section header */}
        <div className="mb-14">
          <span className="font-mono text-xs text-[#57B8FF]/60 uppercase tracking-widest">Selected Works</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight uppercase font-mono tracking-tight mt-2">
            {p.heading} <span className="text-[#57B8FF]">{p.headingAccent}</span>
          </h2>
        </div>

        {/* Repo cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {p.cards.map((project, index) => {
            const lang = LANG_STACK[index % LANG_STACK.length];
            return (
              <div
                key={project.id}
                className="group border border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-accent-purple/40 transition-all duration-300 hover:-translate-y-1 flex flex-col"
                style={{ backgroundColor: '#1A1A1A' }}
                onClick={() => handleProjectClick(project)}
              >
                {/* Image preview with overlay */}
                <div className="relative aspect-[16/9] overflow-hidden shrink-0">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={project.description}
                    src={project.imgSrc}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
                  {/* Branch badge */}
                  <div className="absolute top-3 right-3">
                    <span className="font-mono text-[10px] px-2 py-0.5 bg-black/60 backdrop-blur-sm border border-white/10 rounded text-green-400">
                      main
                    </span>
                  </div>
                </div>

                {/* Repo metadata */}
                <div className="p-5 flex flex-col flex-1">
                  {/* Repo name row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <GitBranch className="w-3.5 h-3.5 text-accent-purple shrink-0" />
                      <span className="font-mono font-bold text-white text-sm group-hover:text-accent-purple transition-colors truncate">
                        {project.title}
                      </span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-accent-purple transition-colors shrink-0 ml-2" />
                  </div>

                  {/* Description */}
                  <p className="text-[14px] text-gray-500 leading-relaxed line-clamp-2 flex-1 mb-4">
                    {project.description}
                  </p>

                  {/* Footer row */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${lang.dot}`} />
                      <span className="font-mono text-[10px] text-gray-600">{lang.label}</span>
                    </div>
                    <span className="font-mono text-[10px] text-gray-700">↗ open</span>
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

export default Portfolio;
