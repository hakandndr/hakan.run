import React from 'react';
import { motion } from 'framer-motion';

const vp = { once: true, amount: 0.15 };
const tr = { duration: 0.65, ease: 'easeOut' };

const TAGS = ['Remote & Hybrid Ready', 'Software Development', 'QA Automation', 'Irvine / Orange County, CA'];

const About = () => (
  <section
    id="about"
    className="relative overflow-hidden py-24 border-t border-white/[0.06]"
    style={{ backgroundColor: '#0B0B0C' }}
  >
    <div className="container mx-auto px-6">

      {/* Header */}
      <div className="mb-14">
        <span className="font-mono text-xs text-[#57B8FF]/60 uppercase tracking-widest">Background</span>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white uppercase font-mono tracking-tight mt-2">
          From Systems to <span className="text-[#57B8FF]">Software</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:items-center">

        {/* ── Left: timeline story ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
          transition={tr}
          className="space-y-10"
        >
          <div className="relative pl-6 border-l-2 border-[#57B8FF]/20">
            <span className="font-mono text-[10px] text-[#57B8FF]/50 uppercase tracking-widest block mb-1">2009 — 2024</span>
            <h3 className="font-mono text-sm font-bold text-[#F4F4F5] mb-3">15 Years in IT & Education Technology — Turkey</h3>
            <p className="text-[15px] text-[#A1A1AA] leading-[1.7]">
              Spent 15 years working across IT infrastructure and education technology in Turkey. As Regional IT Project Coordinator for the FATIH Project — a nationwide Ministry of Education initiative — managed school infrastructure across dozens of sites, overseeing 400+ workstation deployments, interactive smart board installations, structured cabling, network systems, and multi-site technical coordination every year.
            </p>
          </div>

          <div className="relative pl-6 border-l-2 border-[#57B8FF]/20">
            <span className="font-mono text-[10px] text-[#57B8FF]/50 uppercase tracking-widest block mb-1">2025 — PRESENT</span>
            <h3 className="font-mono text-sm font-bold text-[#F4F4F5] mb-3">Software Developer — Irvine, California</h3>
            <p className="text-[15px] text-[#A1A1AA] leading-[1.7]">
              Relocated to the United States with a Green Card — no sponsorship required. Now focused on software development, QA automation engineering with Playwright, and cloud-ready web applications. The infrastructure background informs every software decision: system thinking, reliability mindset, and an automation-first approach to quality and delivery.
            </p>
          </div>
        </motion.div>

        {/* ── Right: desk photo + tags ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
          transition={{ ...tr, delay: 0.12 }}
        >
          <div className="w-full max-w-[240px] sm:max-w-[280px] lg:max-w-[320px] mx-auto lg:mx-0 rounded-2xl overflow-hidden border border-white/[0.08]"
            style={{ backgroundColor: '#111112' }}
          >
            <img
              src="/media/HakanDundar.webp"
              alt="Hakan Dundar"
              className="w-full object-cover object-top block"
              style={{ aspectRatio: '4/5' }}
            />
          </div>

          <div className="flex flex-wrap gap-2 mt-4 max-w-[320px] mx-auto lg:mx-0">
            {TAGS.map(tag => (
              <span
                key={tag}
                className="font-mono text-[10px] text-[#9CA3AF] px-2.5 py-1 border border-white/[0.08] rounded bg-white/[0.02]"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  </section>
);

export default About;
