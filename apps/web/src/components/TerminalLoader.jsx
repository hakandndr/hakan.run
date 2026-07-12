import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const LINES = [
  { ms: 0,   text: '$ init hakan.run',              cls: 'text-gray-600' },
  { ms: 250, text: '> loading components...  [OK]', cls: 'text-green-400' },
  { ms: 550, text: '> mounting services...   [OK]', cls: 'text-green-400' },
  { ms: 850, text: '> boot sequence complete',      cls: 'text-accent-purple' },
];

const TerminalLoader = ({ onDone }) => {
  const [visible, setVisible] = useState([]);

  useEffect(() => {
    const timers = LINES.map(({ ms }, i) =>
      setTimeout(() => setVisible(v => [...v, i]), ms)
    );
    const done = setTimeout(onDone, 1300);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[99999] flex items-center justify-center"
      style={{ backgroundColor: '#0C0D0D' }}
    >
      <div className="font-mono text-sm w-72 space-y-2">
        <div className="text-gray-800 text-[10px] mb-5 select-none tracking-widest uppercase">
          BIOS v2.0.26 — hakan.run
        </div>
        {LINES.map(({ text, cls }, i) => (
          <div
            key={i}
            className={`transition-opacity duration-150 ${visible.includes(i) ? 'opacity-100' : 'opacity-0'} ${cls}`}
          >
            {text}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default TerminalLoader;
