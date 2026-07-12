import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Stats from '@/components/Stats';
import SectionAnimator from '@/components/SectionAnimator';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const projectData = {
  'full-stack-development': {
    title: 'Full-Stack SaaS Platform',
    category: 'Software Development',
    description: 'A production-style web application built with a focus on clean architecture, responsive UI, and real-world product functionality — covering the full stack from component design to backend data integration.',
    overview: 'A production-style SaaS platform built to mirror how modern web products are actually shipped. The focus is clean architecture, reusable component design, responsive interfaces, and structured backend logic — organized for maintainability and scalability from day one. This represents a complete application development cycle: from UI to API, from local dev to deployment-ready structure.',
    whatIBuiltHeading: 'What I Build',
    whatIBuilt: [
      'Scalable web applications with clean UI and real-world product functionality',
      'Reusable frontend component libraries for faster, consistent development across features',
      'Responsive layouts optimized for desktop, tablet, and mobile environments',
      'Dashboard-style interfaces for data presentation, user workflows, and admin views',
      'Backend / API integration connecting frontend pages to structured data sources',
      'Modular code architecture designed for long-term maintainability and feature growth',
    ],
    technicalScope: {
      categories: [
        { label: 'Frontend',      tools: ['React', 'Vite', 'Tailwind CSS', 'Framer Motion'] },
        { label: 'Backend',       tools: ['Node.js', 'ASP.NET Core', 'REST APIs', 'Supabase'] },
        { label: 'Key Focus',     tools: ['Component-driven UI', 'Responsive design', 'Data visualization', 'Clean architecture', 'Production structure'] },
      ],
    },
    realWorldValue: 'Modern businesses need applications that are fast to build, easy to maintain, and reliable in production. This project demonstrates the ability to take a product from design to deployment — with clean code, structured architecture, and a UI that actually works for real users and real workflows. The result is software that a team can continue building on without fighting the codebase.',
    images: {
      hero: {
        alt: 'SaaS admin dashboard with metrics, charts, and user table',
        src: '/portfolio/full-stack-saas-detail.svg',
      },
      supporting: {
        alt: 'VS Code editor showing React TypeScript component code',
        src: '/portfolio/full-stack-code-detail.svg',
      },
    },
    stats: [
      { value: 15,  suffix: '+', label: 'Reusable Components',   description: 'Built with modular UI sections for maintainability and faster development.' },
      { value: 3,   suffix: '',  label: 'Core Modules',          description: 'Structured around key product areas and user workflows.' },
      { value: 100, suffix: '%', label: 'Responsive Design',     description: 'Optimized across desktop and mobile screen sizes.' },
      { value: 4,   suffix: '+', label: 'Integrated Data Views', description: 'Includes charts, structured panels, and business-focused data presentation.' },
    ],
  },

  'ai-and-automation': {
    title: 'QA Automation with Playwright',
    category: 'QA Automation & SDET',
    description: 'An end-to-end browser automation framework built to validate real user flows, eliminate repetitive manual regression testing, and give development teams faster, more reliable release confidence.',
    overview: 'A Playwright-based QA automation framework built to replace repetitive manual testing with structured, maintainable automated test coverage. Tests run real browser-level user flows — login sequences, form submissions, navigation paths, dashboard interactions — and integrate with CI/CD pipelines so validation happens automatically before every release. The goal is faster feedback, fewer regressions, and more confident shipping.',
    whatIBuiltHeading: 'What I Build',
    whatIBuilt: [
      'Automated browser tests covering login flows, form submissions, navigation, and dashboard interactions',
      'End-to-end regression test suites that replace repetitive manual validation cycles',
      'Reusable page object patterns and test utilities for a maintainable test architecture',
      'CI/CD pipeline integration for automated test execution on every code push or build trigger',
      'Structured test reports that surface failures clearly and accelerate root-cause debugging',
      'Cross-browser and cross-environment test coverage for broader release confidence',
    ],
    technicalScope: {
      categories: [
        { label: 'Testing Tools', tools: ['Playwright', 'JavaScript / TypeScript', 'Page Object Model', 'Test Reporting'] },
        { label: 'CI / CD',       tools: ['GitHub Actions', 'Pipeline Integration', 'Pre-release Validation', 'Automated Triggers'] },
        { label: 'Key Focus',     tools: ['E2E testing', 'Regression automation', 'UI validation', 'API integration testing', 'SDET practices'] },
      ],
    },
    realWorldValue: "Manual regression testing doesn't scale. As applications grow, teams spend increasing hours re-testing flows that rarely change — time that should go toward building new features. Playwright automation replaces that overhead: running comprehensive checks in minutes, surfacing issues before users see them, and giving teams the confidence to ship faster without sacrificing quality. Less manual effort. Fewer production surprises.",
    images: {
      hero: {
        alt: 'Playwright test runner showing test suites and browser preview',
        src: '/portfolio/qa-playwright-detail.svg',
      },
      supporting: {
        alt: 'CI/CD pipeline stages and test coverage report dashboard',
        src: '/portfolio/qa-test-report-detail.svg',
      },
    },
    stats: [
      { value: 80,  suffix: '%',   label: 'Manual Effort Reduced',    description: 'Reduced repetitive regression work through reusable automation.' },
      { value: 10,  suffix: '+',   label: 'Critical Flows Automated', description: 'Covered important user paths with end-to-end test scenarios.' },
      { value: 15,  suffix: 'min', label: 'Execution Cycle',          description: 'Built for quicker feedback compared with repetitive manual validation.' },
      { value: 1,   suffix: '',    label: 'Reusable Framework',       description: 'Structured for maintainability, scalability, and clearer test organization.' },
    ],
  },

  'it-infrastructure': {
    title: 'Infrastructure & Systems Modernization',
    category: 'IT Infrastructure',
    description: '15+ years of hands-on IT infrastructure experience — enterprise workstation deployment, network administration, systems management, and Tier-2/3 field support across large-scale, multi-site environments.',
    overview: '15+ years of hands-on IT infrastructure and systems administration experience across real enterprise environments. Served as Regional IT Project Coordinator for the FATIH Project, a nationwide Turkish Ministry of Education technology initiative — managing infrastructure across dozens of schools, supporting thousands of active users, and overseeing hundreds of device deployments every year. Every item below reflects real field work, not certifications.',
    whatIBuiltHeading: 'What I Delivered',
    whatIBuilt: [
      'Deployed 400+ OEM workstations annually — imaging, configuration, and full network integration',
      'Set up and managed 20+ computer labs per year, including structured cabling and software configuration',
      'Installed and maintained 100+ Interactive Flat Panel Displays (Smart Boards) annually',
      'Administered Windows Server, Active Directory, Group Policy (GPO), and SCCM for enterprise endpoint management',
      'Managed DNS, DHCP, VPN, LAN/WAN networking, and enterprise Wi-Fi infrastructure optimization',
      'Operated Microsoft 365 Admin, Remote Desktop Services, and Jira-based IT support workflows',
      'Provided Tier-2 and Tier-3 field support — resolving complex network, software, and hardware conflicts',
      'Coordinated multi-site infrastructure deployments as Regional IT Project Coordinator',
    ],
    technicalScope: {
      categories: [
        { label: 'Systems & Platforms', tools: ['Windows Server', 'Active Directory', 'Group Policy (GPO)', 'SCCM', 'Microsoft 365 Admin'] },
        { label: 'Networking',          tools: ['DNS', 'DHCP', 'VPN', 'LAN / WAN', 'Wi-Fi Optimization', 'Structured Cabling'] },
        { label: 'Operations & Tools',  tools: ['Jira', 'Remote Desktop Services', 'Endpoint Imaging', 'Tier-2/3 Field Support', 'Multi-site Coordination'] },
      ],
    },
    realWorldValue: 'Large-scale IT environments fail when infrastructure is inconsistent, endpoints are misconfigured, and support is reactive. 15+ years of building and maintaining the systems that thousands of users depend on daily — with a disciplined focus on reliability, operational structure, and proactive problem-solving. The experience spans from pulling cable to managing Active Directory for an entire region.',
    images: {
      hero: {
        alt: 'Modern server room and data center infrastructure',
        src: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
      },
      supporting: {
        alt: 'Network rack with cabling and patch panel infrastructure',
        src: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
      },
    },
    stats: [
      { value: 400, suffix: '+', label: 'Endpoints Deployed',     description: 'Supported workstation setup, deployment, and operational readiness across multiple environments.' },
      { value: 100, suffix: '+', label: 'Smart Boards Supported', description: 'Hands-on experience with interactive panel deployment and support workflows.' },
      { value: 3,   suffix: '',  label: 'Support Tiers',          description: 'Worked across layered support responsibilities, including more advanced troubleshooting.' },
      { value: 15,  suffix: '+', label: 'Years Experience',       description: 'Long-term technical experience across IT support, systems, and infrastructure operations.' },
    ],
  },
};

const pageVariants  = { initial: { opacity: 0 }, in: { opacity: 1 }, out: { opacity: 0 } };
const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.8 };

const TerminalFrame = ({ label, children, aspectClass = 'aspect-video' }) => (
  <div className="border border-white/10 rounded-xl overflow-hidden" style={{ backgroundColor: '#1A1A1A' }}>
    <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/[0.06]" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
      <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
      <span className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
      <span className="ml-3 font-mono text-[10px] text-gray-600 truncate">{label}</span>
    </div>
    <div className={aspectClass}>{children}</div>
  </div>
);

const ContentCard = ({ cmdPrefix, label, accentClass = 'text-accent-purple', children }) => (
  <div className="border border-white/10 rounded-xl overflow-hidden" style={{ backgroundColor: '#1A1A1A' }}>
    <div className="px-5 py-3 border-b border-white/[0.06]" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
      <span className="font-mono text-[10px] text-gray-600 uppercase tracking-widest">
        <span className={`${accentClass} opacity-40 mr-1`}>{cmdPrefix}</span>{label}
      </span>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const Project = () => {
  const { projectId } = useParams();
  const project = projectData[projectId] || projectData['full-stack-development'];
  const repoName = projectId || 'full-stack-development';
  const repoUrls = {
    'full-stack-development': 'https://github.com/hakandndr/hakan.run',
    'ai-and-automation': 'https://github.com/hakandndr/hakan.run',
  };
  const repoUrl = repoUrls[projectId];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [projectId]);

  return (
    <motion.div
      initial="initial" animate="in" exit="out"
      variants={pageVariants} transition={pageTransition}
      className="relative overflow-hidden text-white"
      style={{ backgroundColor: '#090909' }}
    >
      <Helmet>
        <title>{project.title} — Hakan Dundar</title>
        <meta name="description" content={project.description} />
      </Helmet>

      <main className="relative z-10">

        {/* ── Header ─────────────────────────────────────────────── */}
        <SectionAnimator>
          <header className="pt-40 pb-12">
            <div className="container mx-auto px-6">
              <div className="flex items-center gap-2 font-mono text-xs text-gray-600 mb-8">
                <Link to="/" className="hover:text-accent-purple transition-colors">~/portfolio</Link>
                <span className="text-gray-800">/</span>
                <span className="text-gray-500">{repoName}</span>
                <span className="animate-pulse text-accent-purple ml-1 select-none">▋</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="font-mono text-[10px] px-2.5 py-1 border border-accent-purple/30 bg-accent-purple/5 rounded text-accent-purple/70 uppercase tracking-widest">
                  {project.category}
                </span>
                <span className="font-mono text-[10px] px-2.5 py-1 bg-black/50 border border-white/10 rounded text-green-400">
                  main
                </span>
                {repoUrl && (
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[10px] px-2.5 py-1 border border-white/10 bg-black/50 rounded text-gray-300 hover:text-accent-purple hover:border-accent-purple/30 transition-colors uppercase tracking-widest"
                  >
                    View on GitHub &#8599;
                  </a>
                )}
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white uppercase font-mono tracking-tight mb-6 leading-[1.05]">
                {project.title}
              </h1>
              <p className="text-[15px] text-gray-500 max-w-3xl leading-[1.7]">
                <span className="text-gray-700 select-none mr-2">{'// '}</span>
                {project.description}
              </p>
            </div>
          </header>
        </SectionAnimator>

        {/* ── Hero image ─────────────────────────────────────────── */}
        <SectionAnimator>
          <div className="container mx-auto px-6 mb-16">
            <div className="max-w-4xl mx-auto">
              <TerminalFrame label={project.images.hero.alt}>
                <img className="w-full h-full object-cover" alt={project.images.hero.alt} src={project.images.hero.src} />
              </TerminalFrame>
            </div>
          </div>
        </SectionAnimator>

        {/* ── Overview ───────────────────────────────────────────── */}
        <SectionAnimator>
          <section className="pb-6">
            <div className="container mx-auto px-6">
              <div className="flex items-center gap-2 font-mono text-xs text-gray-600 mb-6">
                <span className="text-accent-purple select-none">❯</span>
                <span>cat ./overview.md</span>
              </div>
              <ContentCard cmdPrefix="##" label="Overview" accentClass="text-accent-purple">
                <p className="text-[15px] text-gray-400 leading-[1.7]">
                  <span className="font-mono text-gray-700 select-none mr-2">{'>'}</span>
                  {project.overview}
                </p>
              </ContentCard>
            </div>
          </section>
        </SectionAnimator>

        {/* ── What I Built ───────────────────────────────────────── */}
        <SectionAnimator>
          <section className="py-6">
            <div className="container mx-auto px-6">
              <div className="flex items-center gap-2 font-mono text-xs text-gray-600 mb-6">
                <span className="text-green-400 select-none">❯</span>
                <span>cat ./capabilities.md</span>
              </div>
              <ContentCard cmdPrefix="##" label={project.whatIBuiltHeading} accentClass="text-green-400">
                <ul className="space-y-3">
                  {project.whatIBuilt.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-[15px] text-gray-400 leading-[1.7]">
                      <span className="text-green-400 mt-0.5 select-none flex-shrink-0">▸</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </ContentCard>
            </div>
          </section>
        </SectionAnimator>

        {/* ── Technical Scope ────────────────────────────────────── */}
        <SectionAnimator>
          <section className="py-6">
            <div className="container mx-auto px-6">
              <div className="flex items-center gap-2 font-mono text-xs text-gray-600 mb-6">
                <span className="text-accent-purple select-none">❯</span>
                <span>cat ./tech-stack.md</span>
              </div>
              <ContentCard cmdPrefix="##" label="Technical Scope" accentClass="text-accent-purple">
                <div className="space-y-6">
                  {project.technicalScope.categories.map((cat, i) => (
                    <div key={i}>
                      <span className="font-mono text-[10px] text-gray-600 uppercase tracking-widest block mb-2.5">
                        <span className="text-accent-purple/50 mr-1.5">—</span>{cat.label}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {cat.tools.map((tool, j) => (
                          <span key={j} className="font-mono text-xs px-2.5 py-1 border border-white/10 bg-white/[0.03] rounded text-gray-400">
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ContentCard>
            </div>
          </section>
        </SectionAnimator>

        {/* ── Real-World Value ───────────────────────────────────── */}
        <SectionAnimator>
          <section className="py-6 pb-16">
            <div className="container mx-auto px-6">
              <div className="flex items-center gap-2 font-mono text-xs text-gray-600 mb-6">
                <span className="text-yellow-400 select-none">❯</span>
                <span>cat ./value.md</span>
              </div>
              <ContentCard cmdPrefix="##" label="Real-World Value" accentClass="text-yellow-400">
                <p className="text-[15px] text-gray-400 leading-[1.7]">
                  <span className="font-mono text-gray-700 select-none mr-2">{'>'}</span>
                  {project.realWorldValue}
                </p>
              </ContentCard>
            </div>
          </section>
        </SectionAnimator>

        {/* ── Stats ──────────────────────────────────────────────── */}
        <Stats customStats={project.stats} />

        {/* ── Supporting image ───────────────────────────────────── */}
        <SectionAnimator>
          <div className="container mx-auto px-6 mt-12 mb-4">
            <div className="max-w-4xl mx-auto">
              <TerminalFrame label={project.images.supporting.alt}>
                <img className="w-full h-full object-cover" alt={project.images.supporting.alt} src={project.images.supporting.src} />
              </TerminalFrame>
            </div>
          </div>
        </SectionAnimator>

        {/* ── CTA ────────────────────────────────────────────────── */}
        <SectionAnimator>
          <section className="py-24">
            <div className="container mx-auto px-6 text-center">
              <div className="inline-flex items-center gap-2 font-mono text-xs text-gray-600 mb-8">
                <span className="text-green-400 select-none">❯</span>
                <span>./connect.sh --mode=collaborate</span>
                <span className="animate-pulse text-accent-purple select-none">▋</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white uppercase font-mono tracking-tight mb-5">
                Ready for Your <span className="text-accent-purple">Next Project?</span>
              </h2>
              <p className="text-[15px] text-gray-500 mb-10 max-w-2xl mx-auto leading-[1.7]">
                <span className="text-gray-700 select-none">{'/* '}</span>
                Let's discuss your next technical challenge and how we can achieve exceptional results together.
                <span className="text-gray-700 select-none">{' */'}</span>
              </p>
              <Button asChild size="lg" className="bg-accent-purple hover:bg-accent-purple/90 text-white font-mono font-bold px-10 py-7 text-lg rounded group">
                <Link to="/contact">
                  <span className="opacity-50 mr-2 text-sm select-none">$</span>
                  Let's Talk
                  <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                </Link>
              </Button>
            </div>
          </section>
        </SectionAnimator>

      </main>
    </motion.div>
  );
};

export default Project;
