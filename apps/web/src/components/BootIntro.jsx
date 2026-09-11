import React from 'react';

const BOOT_LINES = [
  { delay: 0, text: '$ init hakan.run', className: 'text-gray-500' },
  { delay: 250, text: '> loading components... [OK]', className: 'text-green-400' },
  { delay: 550, text: '> mounting services... [OK]', className: 'text-green-400' },
  { delay: 850, text: '> boot sequence complete', className: 'text-accent-purple' },
];

// A fixed, non-interactive presentation layer. It neither reads nor gates the
// published snapshot and its animation has no callback into application state.
const BootIntro = () => (
  <div
    data-boot-intro="presentation"
    aria-hidden="true"
    className="boot-intro fixed inset-0 z-[99999] flex items-center justify-center bg-[#0C0D0D] pointer-events-none"
  >
    <div className="font-mono text-sm w-72 space-y-2">
      <div className="text-gray-700 text-[10px] mb-5 select-none tracking-widest">
        BIOS V2.0.26 — HAKAN.RUN
      </div>
      {BOOT_LINES.map(({ delay, text, className }) => (
        <div
          key={text}
          className={`boot-intro__line ${className}`}
          style={{ '--boot-line-delay': `${delay}ms` }}
        >
          {text}
        </div>
      ))}
    </div>
  </div>
);

export default BootIntro;
