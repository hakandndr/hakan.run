import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useContent } from '@/contexts/ContentContext';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in:      { opacity: 1, y: 0  },
  out:     { opacity: 0, y: -20 }
};
const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.5 };

const Contact = () => {
  const { content } = useContent();
  const ct = content.contact;
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    try {
      setStatus('Sending...');
      const response = await fetch(ct.formEndpoint, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        setStatus('Success!');
        form.reset();
      } else {
        setStatus('Message failed. Please try again.');
        setTimeout(() => setStatus(''), 4000);
      }
    } catch {
      setStatus('Message failed. Please try again.');
      setTimeout(() => setStatus(''), 4000);
    }
  };

  const isSending = status === 'Sending...';
  const isSuccess = status === 'Success!';
  const isError   = status && !isSending && !isSuccess;

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
      <Helmet>
        <title>{ct.pageTitle}</title>
        <meta name="description" content={ct.metaDescription} />
      </Helmet>

      <section className="relative overflow-hidden min-h-screen py-32" style={{ backgroundColor: '#090909' }}>
        <div className="container mx-auto px-6 relative z-10">

          {/* Terminal prompt header */}
          <div className="flex items-center gap-2 font-mono text-xs text-gray-600 mb-16">
            <span className="text-accent-purple select-none">❯</span>
            <span>./connect.sh --open-channel</span>
            <span className="animate-pulse text-accent-purple select-none">▋</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

            {/* Left column — heading + info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white uppercase font-mono tracking-tight mb-6 leading-tight">
                {ct.heading} <span className="text-accent-purple">{ct.headingAccent}</span>
              </h1>
              <p className="text-[15px] text-gray-500 max-w-sm mb-12 leading-[1.7]">
                <span className="text-gray-700 select-none">{'/* '}</span>
                {ct.subtitle}
                <span className="text-gray-700 select-none">{' */'}</span>
              </p>

              {/* Info blocks */}
              <div className="space-y-6 border-l border-accent-purple/20 pl-5 mb-10">
                {ct.infoBlocks.map((block) => (
                  <div key={block.title}>
                    <h3 className="font-mono text-[10px] text-accent-purple/70 uppercase tracking-widest mb-1.5">
                      {block.title}
                    </h3>
                    {block.lines.map((line, j) => (
                      <p key={j} className="text-[15px] text-gray-400">
                        <span className="text-gray-700 select-none mr-2">{'>'}</span>
                        {line.includes('@') ? (
                          <a href={`mailto:${line}`} className="hover:text-accent-purple transition-colors">{line}</a>
                        ) : line}
                      </p>
                    ))}
                  </div>
                ))}
              </div>

              {/* Social links */}
              <motion.div
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                {ct.socialLinks.map(link => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-gray-500 hover:text-accent-purple transition-colors flex items-center gap-1 group"
                  >
                    <span className="text-gray-800 group-hover:text-accent-purple/50 transition-colors select-none">./</span>
                    {link.name}
                  </a>
                ))}
              </motion.div>
            </motion.div>

            {/* Right column — form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <div
                className="border border-white/10 rounded-xl overflow-hidden"
                style={{ backgroundColor: '#1A1A1A' }}
              >
                {/* Terminal title bar */}
                <div
                  className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06]"
                  style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                  <span className="ml-3 font-mono text-[10px] text-gray-600">~/contact/new-message.sh</span>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  {/* Honeypot — bots fill this, humans never see it. Formspree drops any submission where it's set. */}
                  <input
                    type="text"
                    name="_gotcha"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block font-mono text-[10px] text-accent-purple/70 uppercase tracking-widest mb-1.5">
                        --name
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="your_name"
                        className="w-full border border-white/[0.08] rounded px-4 py-3 font-mono text-sm text-white placeholder-gray-700 focus:outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/30 transition-all duration-200" style={{ backgroundColor: '#0D0D0D' }}
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] text-accent-purple/70 uppercase tracking-widest mb-1.5">
                        --email
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="user@domain.com"
                        className="w-full border border-white/[0.08] rounded px-4 py-3 font-mono text-sm text-white placeholder-gray-700 focus:outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/30 transition-all duration-200" style={{ backgroundColor: '#0D0D0D' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] text-accent-purple/70 uppercase tracking-widest mb-1.5">
                      --message
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={5}
                      placeholder="// describe your project or inquiry..."
                      className="w-full border border-white/[0.08] rounded px-4 py-3 font-mono text-sm text-white placeholder-gray-700 focus:outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/30 transition-all duration-200 resize-none" style={{ backgroundColor: '#0D0D0D' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSending}
                    className={`w-full font-mono font-bold py-4 rounded transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                      isSending
                        ? 'bg-gray-800 cursor-not-allowed text-gray-500'
                        : isSuccess
                        ? 'bg-green-600/10 border border-green-500/30 text-green-400'
                        : 'bg-accent-purple hover:bg-accent-purple/90 text-white'
                    }`}
                  >
                    <span className="opacity-40 select-none">$</span>
                    {isSending ? 'sending...' : isSuccess ? '✓ message sent' : 'send --now'}
                  </button>

                  {isError && (
                    <p className="font-mono text-xs text-red-400 text-center">
                      <span className="select-none mr-1">✗</span>{status}
                    </p>
                  )}
                  {isSuccess && (
                    <p className="font-mono text-xs text-green-400 text-center">
                      <span className="select-none mr-1">✓</span>Message sent successfully.
                    </p>
                  )}
                </form>
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default Contact;
