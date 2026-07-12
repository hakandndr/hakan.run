import React from 'react';
import { motion } from 'framer-motion';

const clientLogos = [
  { name: 'InnovateCore', description: 'Placeholder for InnovateCore' },
  { name: 'QuantumLeap', description: 'Placeholder for QuantumLeap' },
  { name: 'AuraFlow', description: 'Placeholder for AuraFlow' },
  { name: 'NexusGen', description: 'Placeholder for NexusGen' },
  { name: 'SparkSolutions', description: 'Placeholder for SparkSolutions' },
  { name: 'VortexLabs', description: 'Placeholder for VortexLabs' },
  { name: 'EchoBridge', description: 'Placeholder for EchoBridge' },
  { name: 'ZenithWorks', description: 'Placeholder for ZenithWorks' },
];

const marqueeLogos = [...clientLogos, ...clientLogos]; // Duplicate for seamless loop

const TrustedClients = () => {
  const marqueeVariants = {
    animate: {
      x: [0, -2016], // Adjust as needed based on actual width
      transition: {
        x: {
          repeat: Infinity,
          repeatType: 'loop',
          duration: 30, // Adjusted for smoother loop with text
          ease: 'linear'
        }
      }
    }
  };

  return (
    <section className="py-20 border-t border-b border-[#1E1E2A] overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="container mx-auto px-6 text-center">
        <p className="text-lg text-gray-400 mb-12 uppercase">Trusted by 150+ Companies Worldwide</p>
        <div className="relative w-full">
          <motion.div className="flex" variants={marqueeVariants} animate="animate">
            {marqueeLogos.map((logo, index) => (
              <div key={index} className="flex-shrink-0 w-48 mx-12 flex justify-center items-center">
                <span className="text-white text-2xl md:text-3xl font-semibold opacity-70">
                  {logo.name}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TrustedClients;