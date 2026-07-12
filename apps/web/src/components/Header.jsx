import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Services', href: '/#services' },
    { name: 'About',    href: '/#about'    },
    { name: 'Portfolio', href: '/#portfolio' },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);

    const logVisitor = async () => {
      try {
        const params = new URLSearchParams({
          path: window.location.pathname + window.location.search,
          referrer: document.referrer || '',
        });
        await fetch(`/run/log_hakanrun.php?${params.toString()}`, { cache: 'no-store' });
      } catch (_) {
      }
    };
    logVisitor();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSmoothScroll = e => {
    e.preventDefault();
    const href = e.currentTarget.getAttribute('href');
    const [path, id] = href.split('#');
    if (path === '/' && id) {
      navigate(path);
      // Retry until the section element is in the DOM — handles cross-route navigation
      const tryScroll = (remaining = 20) => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else if (remaining > 0) {
          setTimeout(() => tryScroll(remaining - 1), 80);
        }
      };
      setTimeout(tryScroll, 80);
    } else {
      navigate(href);
    }
    if (isOpen) setIsOpen(false);
  };

  const handleHomeClick = e => {
    e.preventDefault();
    navigate('/');
    if (isOpen) setIsOpen(false);
  };

  const handleCTA = () => {
    navigate('/contact');
    if (isOpen) setIsOpen(false);
  };

  const TransparentLogo = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-110"
      fill="none"
    >
      <text x="50" y="60" fontFamily="monospace" fontSize="46" fontWeight="bold"
        fill="none" stroke="#0077ff" strokeWidth="4" textAnchor="middle" opacity="0.5">
        &lt;h&gt;
      </text>
      <text x="50" y="60" fontFamily="monospace" fontSize="46" fontWeight="bold"
        fill="#00d2ff" textAnchor="middle">
        &lt;h&gt;
      </text>
      <text x="50" y="85" fontFamily="sans-serif" fontSize="14" fontWeight="bold"
        fill="#ffffff" textAnchor="middle">
        hakan.run
      </text>
    </svg>
  );

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b ${
          isScrolled ? 'backdrop-blur-lg border-white/[0.08]' : 'border-transparent'
        }`}
        style={{ backgroundColor: isScrolled ? 'rgba(9,9,9,0.92)' : 'rgba(9,9,9,0.60)' }}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-purple/40 to-transparent" />

        <div className="container mx-auto px-6 h-20 flex justify-between items-center">

          {/* Logo — two-line path style */}
          <Link to="/" onClick={handleHomeClick} className="flex items-center gap-3 group">
            <TransparentLogo />
            <div>
              <div className="font-mono text-[10px] text-accent-purple/50 leading-none mb-1 tracking-widest select-none">
                ~/portfolio
              </div>
              <div className="text-sm font-bold text-white font-mono tracking-[0.2em] uppercase leading-none">
                HAKAN DUNDAR
              </div>
            </div>
          </Link>

          {/* Desktop nav — comment-prefix style */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <a
                key={link.name}
                href={link.href}
                onClick={handleSmoothScroll}
                className="relative px-4 py-2 font-mono text-xs text-white/75 hover:text-white transition-colors tracking-wide uppercase group"
              >
                <span className="text-accent-purple/50 mr-1 group-hover:text-accent-purple/80 transition-colors select-none">//</span>
                {link.name}
                <span className="absolute bottom-0 left-4 right-4 h-px bg-accent-purple scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </a>
            ))}
          </nav>

          {/* CTA — terminal command style */}
          <div className="hidden md:flex items-center">
            <Button
              className="bg-accent-purple text-white hover:bg-accent-purple/90 group rounded font-mono text-sm px-5 h-9"
              onClick={handleCTA}
            >
              <span className="opacity-50 mr-1.5 text-xs select-none">$</span>
              Let's Run
              <ArrowRight className="ml-2 h-3.5 w-3.5 transform transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Mobile toggle — bracket style */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="font-mono text-sm text-white border border-white/20 px-3 py-1.5 rounded hover:border-accent-purple/50 hover:text-accent-purple transition-colors"
            >
              {isOpen ? '[x]' : '[=]'}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: '-100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '-100%' }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 md:hidden"
            style={{ backgroundColor: '#090909' }}
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-purple/40 to-transparent" />

            <div className="container mx-auto px-6 h-full flex flex-col">
              <div className="flex justify-between items-center h-20">
                <Link to="/" onClick={handleHomeClick} className="flex items-center gap-3 group">
                  <TransparentLogo />
                  <div>
                    <div className="font-mono text-xs leading-none mb-1 select-none">
                      <span className="text-gray-600">&lt;</span>
                      <span className="text-accent-purple font-semibold">hakan.run</span>
                      <span className="text-gray-600"> /&gt;</span>
                    </div>
                    <div className="text-sm font-bold text-white font-mono tracking-[0.2em] uppercase leading-none">
                      HAKAN DUNDAR
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="font-mono text-sm text-white border border-white/20 px-3 py-1.5 rounded hover:border-accent-purple/50 hover:text-accent-purple transition-colors"
                >
                  [x]
                </button>
              </div>

              <nav className="flex-grow flex flex-col justify-center items-center gap-8">
                {navLinks.map((link, index) => (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    onClick={handleSmoothScroll}
                    className="font-mono text-2xl font-bold text-gray-200 hover:text-accent-purple transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 + index * 0.08 }}
                  >
                    <span className="text-accent-purple/40 mr-3 text-lg select-none">./</span>
                    {link.name}
                  </motion.a>
                ))}
              </nav>

              <div className="py-8">
                <Button
                  className="bg-accent-purple text-white hover:bg-accent-purple/90 group w-full font-mono text-base py-6 rounded"
                  onClick={handleCTA}
                >
                  <span className="opacity-50 mr-2 text-sm select-none">$</span>
                  Let's Run
                  <ArrowRight className="ml-2 h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
