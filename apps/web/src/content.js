// Fallback content used before optional local and Supabase section overrides.

export const heroProfileDefaults = {
  image: '/media/HakanDundar.webp',
  imageAlt: 'Hakan Dundar',
  name: 'Hakan Dundar',
  role: 'Software Developer',
  location: 'Orange County, CA',
  topValue: '15+',
  topLabel: 'Years in Tech',
  bottomLabel: 'US Software',
  bottomValue: 'QA Automation',
};

export const aboutChipDefaults = [
  'Remote & Hybrid Ready',
  'Software Development',
  'QA Automation',
  'Orange County, CA',
];

export const footerBottomDefaults = {
  signature: '© 2026 Hakan.run — Built under DNDR Labs.',
  location: 'Orange County, CA USA',
};

export const siteContent = {

  // ─── COLORS ───────────────────────────────────────────────────────────────
  colors: {
    accentPurple: '#57B8FF',
    background: '#090909',
    cardBackground: '#151515',
    heroOverlay: '#000000',
  },

  // ─── TYPOGRAPHY ───────────────────────────────────────────────────────────
  typography: {
    headingFont: 'mono',      // 'mono' | 'sans' | 'serif'
    bodySize: 'md',            // 'sm' | 'md' | 'lg'
    sectionSpacing: 'default', // 'compact' | 'default' | 'spacious'
  },

  // ─── VISIBILITY ───────────────────────────────────────────────────────────
  visibility: {
    services: true,
    about: true,
    portfolio: true,
    stats: true,
    cta: true,
  },

  // ─── HEADER ───────────────────────────────────────────────────────────────
  header: {
    siteName: 'Hakan Dundar',
    ctaButton: "Let's Run",
    navLinks: [
      { name: 'Services', href: '/#services'  },
      { name: 'Portfolio', href: '/#portfolio' },
      { name: 'About',    href: '/#about'     },
    ],
  },

  // ─── HERO ─────────────────────────────────────────────────────────────────
  hero: {
    badge: 'Software Developer',
    headingLine1: 'BUILD. DEPLOY.',
    headingLine2: 'RUN.',
    paragraph: "I'm Hakan Dundar. I spent 15 years in Turkey working across IT infrastructure, education technology, and large-scale technical operations. After moving to the United States with a Green Card, I shifted my focus into software development, QA automation, and cloud-ready web applications. Based in Irvine, California, I combine systems thinking, clean code, and automation-first engineering to build reliable products that actually run in production.",
    paragraphs: [
      "I'm Hakan Dundar. I spent 15 years in Turkey working across IT infrastructure, education technology, and large-scale technical operations. After moving to the United States with a Green Card, I shifted my focus into software development, QA automation, and cloud-ready web applications. Based in Irvine, California, I combine systems thinking, clean code, and automation-first engineering to build reliable products that actually run in production.",
    ],
    primaryButton: 'View Projects',
    primaryButtonHref: '#portfolio',
    secondaryButton: "Let's Connect",
    secondaryButtonHref: '/contact',
    profile: { ...heroProfileDefaults },
  },

  // ─── SERVICES / EXPERTISE ─────────────────────────────────────────────────
  services: {
    heading: 'MY',
    headingAccent: 'EXPERTISE',
    subtitle: 'Combining a strong analytical background with modern development practices to deliver high-quality technical solutions.',
    filterTags: ['SDET', 'QA Automation', 'Full-Stack Dev', 'Cloud & DevOps', 'IT Infrastructure'],
    items: [
      {
        title: 'QA Automation & SDET',
        description: 'Building robust end-to-end automation frameworks with modern tools like Playwright, Selenium, and Cypress. Ensuring flawless software delivery and maximum test coverage across the SDLC.',
      },
      {
        title: 'Full-Stack Development',
        description: 'Crafting high-performance web applications and scalable backend APIs using ASP.NET Core and Node.js. Focused on clean code architecture and creating seamless, responsive user experiences.',
      },
      {
        title: 'Cloud & DevOps Engineering',
        description: 'Architecting scalable cloud solutions using AWS and Azure. Streamlining deployment processes with Docker containerization and robust CI/CD pipelines for continuous integration and rapid delivery.',
      },
      {
        title: 'IT Infrastructure & Systems',
        description: 'Extensive hands-on experience in modernizing IT environments. Managing Windows Server domains, Active Directory, hardware provisioning, and maintaining secure, enterprise-grade networks.',
      },
    ],
  },

  // ─── ABOUT ────────────────────────────────────────────────────────────────
  about: {
    chips: [...aboutChipDefaults],
    block1: {
      heading: 'From Systems to',
      headingAccent: 'Software',
      image: '/media/HakanDundar.webp',
      imageAlt: 'Hakan Dundar',
      sections: [
        {
          title: '15 Years in IT & Education Technology — Turkey',
          body: 'Spent 15 years working across IT infrastructure and education technology in Turkey. As Regional IT Project Coordinator for the FATIH Project — a nationwide Ministry of Education initiative — managed school infrastructure across dozens of sites, overseeing 400+ workstation deployments, interactive smart board installations, structured cabling, network systems, and multi-site technical coordination every year.',
        },
        {
          title: 'Software Developer — Irvine, California',
          body: 'Relocated to the United States with a Green Card — no sponsorship required. Now focused on software development, QA automation engineering with Playwright, and cloud-ready web applications. The infrastructure background informs every software decision: system thinking, reliability mindset, and an automation-first approach to quality and delivery.',
        },
      ],
    },
    block2: {
      visible: true,
      heading: 'Based in',
      headingAccent: 'Orange County, CA',
      image: '/media/hkndesk.webp',
      imageAlt: 'Creative coding environment',
      sections: [
        {
          title: 'Remote & Hybrid Ready',
          body: 'As a U.S. Permanent Resident (Green Card holder) requiring no sponsorship, I am fully authorized and ready to work across the States. Currently based in Orange County, California, I actively contribute to modern tech stacks in hybrid and remote environments—crafting efficient applications and running rigorous CI/CD pipelines.',
        },
        {
          title: 'Beyond the IDE',
          body: "My passion for exploration extends far beyond the keyboard. When I'm not writing code, you can find me exploring the underwater world as a certified scuba diver, hiking local trails, or capturing cinematic aerial footage along the coast as an FAA-certified drone pilot. I also bring my focus on high performance to my personal life—whether that means building custom PC rigs from scratch or maintaining a disciplined fitness routine backed by cooking my own high-protein meals.",
        },
      ],
    },
  },

  // ─── PORTFOLIO ────────────────────────────────────────────────────────────
  portfolio: {
    badge: 'Selected Works',
    heading: 'Explore my latest',
    headingAccent: 'technical builds',
    subtitle: 'A curated selection of my recent software development projects, automation frameworks, and technical implementations.',
    cards: [
      {
        id: 1,
        slug: 'full-stack-development',
        title: 'Full Stack Development',
        description: 'Building scalable web applications with clean architecture, responsive design, and real-world product functionality.',
        imgSrc: '/portfolio/full-stack-saas-card.svg',
        externalUrl: '',
        technology: 'Project',
      },
      {
        id: 2,
        slug: 'ai-and-automation',
        title: 'AI & Automation',
        description: 'Designing automation workflows and Playwright-based testing solutions to improve quality, speed, and reliability.',
        imgSrc: '/portfolio/qa-automation-card.svg',
        externalUrl: '',
        technology: 'Project',
      },
      {
        id: 3,
        slug: 'it-infrastructure',
        title: 'IT Infrastructure',
        description: 'Hands-on experience in systems support, endpoint deployment, network organization, and IT operations.',
        imgSrc: '/portfolio/it-infrastructure-card.svg',
        externalUrl: '',
        technology: 'Project',
      },
    ],
  },

  // ─── STATS ────────────────────────────────────────────────────────────────
  stats: {
    heading: 'BY THE',
    headingAccent: 'NUMBERS',
    subtitle: 'A quick look at the experience, dedication, and continuous drive for technical excellence I bring to the table.',
    items: [
      {
        value: 15,
        suffix: '+',
        label: 'Years in Tech',
        description: 'Proven track record from enterprise systems administration to modern software engineering.',
      },
      {
        value: 80,
        suffix: '%',
        label: 'QA Time Saved',
        description: 'Reduced manual testing cycles through robust, end-to-end automated CI/CD pipelines.',
      },
      {
        value: 400,
        suffix: '+',
        label: 'Annual Deployments',
        description: 'Orchestrated the assembly and secure network integration of enterprise workstations.',
      },
      {
        value: 99.9,
        suffix: '%',
        label: 'System Reliability',
        description: 'Ensuring high availability and flawless execution for full-stack apps and test frameworks.',
      },
    ],
  },

  // ─── CTA ──────────────────────────────────────────────────────────────────
  cta: {
    heading: 'Ready to Run Your Next',
    headingAccent: 'Project',
    headingSuffix: '?',
    paragraph: "Let's collaborate to build something extraordinary. Whether it's crafting clean code, automating a pipeline, or launching a robust application, I'm ready to turn your technical vision into reality.",
    button: "Let's Connect",
    buttonHref: '/contact',
  },

  // ─── CONTACT ──────────────────────────────────────────────────────────────
  contact: {
    pageTitle: 'Connect - Hakan Dundar',
    metaDescription: 'Reach out to Hakan Dundar for QA Automation, SDET, and Software Development inquiries.',
    heading: "Let's",
    headingAccent: 'Collaborate',
    subtitle: "Whether you're looking to build robust automation frameworks, craft scalable software, or just talk tech—my inbox is always open. Let's build something exceptional.",
    infoBlocks: [
      { title: 'Inquiries',       lines: ['hakan@dndr.net'] },
      { title: 'Location',        lines: ['Irvine / Orange County', 'California, USA'] },
      { title: 'Current Status',  lines: ['Remote / Hybrid', 'Open to Relocation'] },
    ],
    socialLinks: [
      { name: 'LinkedIn',    url: 'https://www.linkedin.com/in/hdundar/' },
      { name: 'GitHub',      url: 'https://github.com/hakandndr' },
      { name: 'Instagram',   url: 'https://www.instagram.com/hdundar/' },
      { name: 'X (Twitter)', url: 'https://x.com/hDundar' },
    ],
    formEndpoint: 'https://formspree.io/f/maqapajb',
  },

  // ─── FOOTER ───────────────────────────────────────────────────────────────
  footer: {
    logoText: '<h/>',
    siteName: 'HAKAN DUNDAR',
    tagline: 'Building, deploying, and running clean code solutions from California.',
    copyright: 'Hakan Dundar. All Rights Reserved.',
    bottomSignature: footerBottomDefaults.signature,
    bottomLocation: footerBottomDefaults.location,
    sections: [
      {
        title: 'Navigation',
        links: [
          { name: 'Home',      href: '/#'         },
          { name: 'Expertise', href: '/#services'  },
          { name: 'Portfolio', href: '/#portfolio' },
          { name: 'About Me',  href: '/#about'     },
        ],
      },
      {
        title: 'Contact',
        links: [
          { name: 'Contact Page', href: '/contact' },
          { name: 'LinkedIn DM',  href: 'https://www.linkedin.com/in/hdundar/' },
        ],
      },
    ],
    socialLinks: [
      { name: 'Linkedin',  url: 'https://www.linkedin.com/in/hdundar/' },
      { name: 'Github',    url: 'https://github.com/hakandndr' },
      { name: 'Instagram', url: 'https://www.instagram.com/hdundar/' },
      { name: 'Twitter',   url: 'https://x.com/hDundar' },
    ],
  },

};
