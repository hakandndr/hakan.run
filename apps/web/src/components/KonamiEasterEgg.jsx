import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SEQ = ['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];

const KonamiEasterEgg = () => {
  const [buffer, setBuffer] = useState([]);
  const [show, setShow] = useState(false);

  // Hint for developers — not visible on page
  useEffect(() => {
    console.log('%c[hakan.run] Easter egg unlocked with: ↑ ↑ ↓ ↓ ← → ← → B A', 'color:#57B8FF;font-family:monospace;font-size:12px;');
  }, []);

  // Key sequence listener
  useEffect(() => {
    const handler = (e) => {
      // Don't intercept while user is typing in a form field
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      setBuffer(prev => {
        const next = [...prev, e.key.toLowerCase()].slice(-SEQ.length);
        if (next.length === SEQ.length && next.every((k, i) => k === SEQ[i])) {
          setShow(true);
        }
        return next;
      });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Escape to close
  useEffect(() => {
    if (!show) return;
    const handler = (e) => { if (e.key === 'Escape') setShow(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setShow(false)}
          className="fixed inset-0 z-[99998] flex items-center justify-center cursor-pointer"
          style={{ backgroundColor: 'rgba(0,0,0,0.96)' }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 22 }}
            className="font-mono text-center select-none px-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-accent-purple text-5xl mb-6 tracking-widest">[ UNLOCKED ]</div>
            <div className="text-white text-lg uppercase tracking-[0.3em] mb-2">Achievement Unlocked</div>
            <div className="text-gray-500 text-sm">// you found the konami code</div>
            <div className="text-gray-700 text-xs mt-8 tracking-widest">↑ ↑ ↓ ↓ ← → ← → B A</div>
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={() => setShow(false)}
                className="font-mono text-xs text-gray-600 border border-white/10 px-4 py-2 rounded hover:border-accent-purple/40 hover:text-accent-purple transition-colors"
              >
                [ ESC ] close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default KonamiEasterEgg;
