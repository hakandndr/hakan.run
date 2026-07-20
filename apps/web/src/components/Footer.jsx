import React from 'react';
import { Github, Twitter, Linkedin, Instagram } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useContent } from '@/contexts/ContentContext';

const SOCIAL_ICONS = {
  Linkedin:  <Linkedin  size={16} />,
  Github:    <Github    size={16} />,
  Instagram: <Instagram size={16} />,
  Twitter:   <Twitter   size={16} />,
};

const Footer = () => {
  const navigate = useNavigate();
  const { content } = useContent();
  const f = content.footer;

  const handleNavClick = (e) => {
    e.preventDefault();
    const href = e.currentTarget.getAttribute('href');
    const [path, id] = href.split('#');
    if (path === '/' || path === '') {
      navigate('/');
      if (id) {
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
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 80);
      }
    }
  };

  const footerSections = f.sections;
  const socialLinks = f.socialLinks.map(s => ({ ...s, icon: SOCIAL_ICONS[s.name] }));

  return (
    <footer className="border-t border-white/[0.06]" style={{ backgroundColor: '#0A0A0A' }}>

      {/* Main columns */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-1.5 mb-1 font-mono">
              <span className="text-accent-purple/50 text-xs select-none">~/</span>
              <span className="font-bold text-accent-purple text-sm">{f.logoText}</span>
              <span className="font-bold text-white text-sm tracking-widest uppercase">{f.siteName}</span>
            </div>
            <p className="font-mono text-xs text-gray-500 mb-5 leading-relaxed">
              <span className="text-gray-700 select-none">{'// '}</span>
              {f.tagline}
            </p>
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={social.name}
                  className="w-8 h-8 border border-white/10 rounded flex items-center justify-center text-gray-600 hover:border-accent-purple/40 hover:text-accent-purple transition-all duration-200"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-4">
                <span className="text-accent-purple/40 mr-1 select-none">##</span>
                {section.title}
              </p>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target={link.href.startsWith('http') ? '_blank' : '_self'}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : ''}
                      onClick={(e) => {
                        if (link.href.startsWith('http')) return;
                        if (link.href === '/contact') {
                          e.preventDefault();
                          navigate('/contact');
                        } else {
                          handleNavClick(e);
                        }
                      }}
                      className="font-mono text-xs text-gray-400 hover:text-accent-purple transition-colors flex items-center gap-1 group"
                    >
                      <span className="text-gray-700 group-hover:text-accent-purple/50 transition-colors select-none">./</span>
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social column (icons already in brand col on mobile; kept for lg grid fill) */}
          <div className="hidden lg:block" />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.06]">
        <div className="container mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-mono text-[11px] text-gray-500">
            © {new Date().getFullYear()} Hakan.run — Built under{' '}
            <a
              href="https://dndr.net"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent-purple transition-colors"
            >
              DNDR Labs
            </a>
            .
          </p>
          <p className="font-mono text-[11px] text-gray-600">
            Irvine, CA USA
          </p>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
