import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { useContent } from '@/contexts/ContentContext';

const AnimatedCounter = ({ to, suffix }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    const isDecimal = to % 1 !== 0;
    const increment = isDecimal ? to / steps : Math.ceil(to / steps);
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= to) {
        setCount(to);
        clearInterval(timer);
      } else {
        setCount(isDecimal ? parseFloat(current.toFixed(1)) : Math.ceil(current));
      }
    }, interval);
    return () => clearInterval(timer);
  }, [isInView, to]);

  return <span ref={ref}>{count}{suffix}</span>;
};

const Stats = ({ customStats }) => {
  const { content } = useContent();
  const st = content.stats;
  const stats = customStats || st.items;
  const isProjectPage = !!customStats;

  return (
    <section
      id="stats-section"
      className="relative overflow-hidden py-24 border-t border-white/[0.06]"
      style={{ backgroundColor: '#111112' }}
    >
      <div className="container mx-auto px-6">

        {!isProjectPage && (
          <div className="mb-14">
            <span className="font-mono text-xs text-[#57B8FF]/60 uppercase tracking-widest">By The Numbers</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white uppercase font-mono tracking-tight mt-2">
              {st.heading} <span className="text-[#57B8FF]">{st.headingAccent}</span>
            </h2>
          </div>
        )}

        {isProjectPage && (
          <div className="mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white uppercase font-mono tracking-tight">
              Project <span className="text-[#57B8FF]">Impact</span>
            </h2>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="p-6 rounded-xl border border-white/[0.08] hover:border-white/[0.14] transition-colors duration-300"
              style={{ backgroundColor: '#151515' }}
            >
              <div className="font-mono text-4xl md:text-5xl font-bold text-[#F4F4F5] mb-3 leading-none">
                <AnimatedCounter to={stat.value} suffix={stat.suffix} />
              </div>
              <p className="font-mono text-xs font-bold text-[#F4F4F5] uppercase tracking-wide mb-2">
                {stat.label}
              </p>
              <p className="text-[14px] text-[#6B7280] leading-[1.65]">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Stats;
