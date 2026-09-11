import React from 'react';

export const BOOT_INTRO_SEEN_KEY = 'hakan.run:boot-intro-seen';

const BOOT_LINES = [
  { delay: 0, text: '$ init hakan.run', className: 'text-gray-500' },
  { delay: 250, text: '> loading components... [OK]', className: 'text-green-400' },
  { delay: 550, text: '> mounting services... [OK]', className: 'text-green-400' },
  { delay: 850, text: '> boot sequence complete', className: 'text-accent-purple' },
];

const claimFirstEntry = () => {
  try {
    if (window.sessionStorage.getItem(BOOT_INTRO_SEEN_KEY) === '1') return false;
    window.sessionStorage.setItem(BOOT_INTRO_SEEN_KEY, '1');
    return true;
  } catch {
    // Storage denial must never block the public application.
    return true;
  }
};

// This state is presentation eligibility only. It is independent of the
// published snapshot, READY, route navigation and scroll restoration.
const BootIntro = () => {
  const [showIntro] = React.useState(claimFirstEntry);
  if (!showIntro) return null;

  return (
    <div
      data-boot-intro="presentation"
      aria-hidden="true"
      className="boot-intro fixed inset-0 z-[99999] flex items-center justify-center pointer-events-none"
      style={{ backgroundColor: 'var(--color-bg, #090909)' }}
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
};

export default BootIntro;
