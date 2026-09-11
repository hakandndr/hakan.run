import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const StatValue = ({ value, suffix }) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.span
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {value}{suffix}
    </motion.span>
  );
};

const PublicStats = ({ stats }) => (
  <section
    id="stats-section"
    data-public-section="stats"
    className="relative overflow-hidden py-24 border-t border-white/[0.06]"
    style={{ backgroundColor: '#111112' }}
  >
    <div className="container mx-auto px-6">
      <div className="mb-14">
        <span className="font-mono text-xs text-[#57B8FF]/60 uppercase tracking-widest">
          {stats.heading} {stats.headingAccent}
        </span>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white uppercase font-mono tracking-tight mt-2">
          {stats.heading} <span className="text-[#57B8FF]">{stats.headingAccent}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.items.map((stat) => (
          <div
            key={stat.label}
            data-stat-card
            className="p-6 rounded-xl border border-white/[0.08] hover:border-white/[0.14] transition-colors duration-300"
            style={{ backgroundColor: '#151515' }}
          >
            <div className="font-mono text-4xl md:text-5xl font-bold text-[#F4F4F5] mb-3 leading-none">
              <StatValue value={stat.value} suffix={stat.suffix} />
            </div>
            <p className="font-mono text-xs font-bold text-[#F4F4F5] uppercase tracking-wide mb-2">
              {stat.label}
            </p>
            <p className="text-[14px] text-[#6B7280] leading-[1.65]">{stat.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default PublicStats;
