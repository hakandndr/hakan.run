import React from 'react';
import { Github, Instagram, Linkedin, Twitter } from 'lucide-react';
import usePublicNavigation from '@/hooks/usePublicNavigation';

const SOCIAL_ICONS = {
  Linkedin: <Linkedin size={16} />,
  Github: <Github size={16} />,
  Instagram: <Instagram size={16} />,
  Twitter: <Twitter size={16} />,
};

const renderLogoText = (text) => {
  const slashIndex = text.indexOf('/');
  if (slashIndex === -1) return text;

  return (
    <>
      {text.slice(0, slashIndex)}
      <span data-footer-logo-slash className="text-white">/</span>
      {text.slice(slashIndex + 1)}
    </>
  );
};

const renderBottomSignature = (text) => {
  const label = 'DNDR Labs';
  const labelIndex = text.indexOf(label);
  if (labelIndex === -1) return text;

  return (
    <>
      {text.slice(0, labelIndex)}
      <a
        href="https://dndr.net"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-accent-purple transition-colors"
      >
        {label}
      </a>
      {text.slice(labelIndex + label.length)}
    </>
  );
};

const PublicFooter = ({ footer }) => {
  const navigateTo = usePublicNavigation();
  const socialLinks = footer.socialLinks.map((social) => ({ ...social, icon: SOCIAL_ICONS[social.name] }));

  const navigateInternal = (event, href) => {
    event.preventDefault();
    navigateTo(href, href.includes('#') ? { behavior: 'smooth' } : undefined);
  };

  return (
    <footer data-public-section="footer" className="border-t border-white/[0.06]" style={{ backgroundColor: '#0A0A0A' }}>
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-1.5 mb-1 font-mono">
              <span className="text-accent-purple/50 text-xs select-none">~/</span>
              <span className="font-bold text-accent-purple text-sm">{renderLogoText(footer.logoText)}</span>
              <span className="font-bold text-white text-sm tracking-widest uppercase">{footer.siteName}</span>
            </div>
            <p className="font-mono text-xs text-gray-500 mb-5 leading-relaxed">
              <span className="text-gray-700 select-none">{'// '}</span>
              {footer.tagline}
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

          {footer.sections.map((section) => (
            <div key={section.title}>
              <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-4">
                <span className="text-accent-purple/40 mr-1 select-none">##</span>
                {section.title}
              </p>
              <ul className="space-y-2.5">
                {section.links.map((link) => {
                  const external = link.href.startsWith('http');
                  return (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        target={external ? '_blank' : undefined}
                        rel={external ? 'noopener noreferrer' : undefined}
                        onClick={external ? undefined : (event) => navigateInternal(event, link.href)}
                        className="font-mono text-xs text-gray-400 hover:text-accent-purple transition-colors flex items-center gap-1 group"
                      >
                        <span className="text-gray-700 group-hover:text-accent-purple/50 transition-colors select-none">./</span>
                        {link.name}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className="hidden lg:block" />
        </div>
      </div>

      <div className="border-t border-white/[0.06]">
        <div className="container mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-mono text-[11px] text-gray-500">{renderBottomSignature(footer.bottomSignature)}</p>
          <p className="font-mono text-[11px] text-gray-600">{footer.bottomLocation}</p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
