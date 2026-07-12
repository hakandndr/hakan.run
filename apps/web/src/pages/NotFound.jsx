import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';

const NotFound = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <Helmet>
        <title>404 — Page Not Found | Hakan Dundar</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <section className="relative overflow-hidden min-h-screen flex items-center py-32" style={{ backgroundColor: '#090909' }}>
        <div className="container mx-auto px-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 font-mono text-xs text-gray-600 mb-8">
              <span className="text-accent-purple select-none">&#10095;</span>
              <span>cd {typeof window !== 'undefined' ? window.location.pathname : '/unknown'}</span>
              <span className="animate-pulse text-accent-purple select-none">&#9611;</span>
            </div>

            <p className="font-mono text-sm text-gray-600 mb-6">
              bash: cd: no such file or directory
            </p>

            <h1 className="text-7xl md:text-9xl font-bold text-white font-mono tracking-tight mb-6">
              4<span className="text-accent-purple">0</span>4
            </h1>

            <p className="text-[15px] text-gray-400 max-w-md mb-10 leading-[1.7] font-mono">
              <span className="text-gray-700 select-none">{'/* '}</span>
              The page you&rsquo;re looking for doesn&rsquo;t exist, moved, or never shipped.
              <span className="text-gray-700 select-none">{' */'}</span>
            </p>

            <Link
              to="/"
              className="inline-flex items-center gap-2 font-mono text-sm text-accent-purple border border-accent-purple/30 hover:bg-accent-purple/10 px-5 py-3 rounded transition-colors"
            >
              <span className="opacity-50 select-none">$</span> cd ~ &nbsp;&rarr;&nbsp; Back home
            </Link>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default NotFound;
