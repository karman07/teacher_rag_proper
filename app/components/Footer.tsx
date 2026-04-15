import Link from 'next/link';
import { Zap } from 'lucide-react';

// Inline SVG social icons (brand icons not in lucide-react)
function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.632L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function LinkedInIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const SOCIAL = [
  { label: 'GitHub', href: 'https://github.com', Icon: GithubIcon },
  { label: 'X (Twitter)', href: 'https://x.com', Icon: XIcon },
  { label: 'LinkedIn', href: 'https://linkedin.com', Icon: LinkedInIcon },
];

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: "What's New", href: '/changelog' },
  ],
  Resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'API Reference', href: '/docs/api' },
    { label: 'Guides', href: '/guides' },
    { label: 'Blog', href: '/blog' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
    { label: 'Press', href: '/press' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Security', href: '/security' },
  ],
};



export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-6 gap-10">
          {/* Brand column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/30">
                <Zap size={16} className="text-white fill-white" />
              </div>
              <span className="font-bold text-xl text-slate-900 dark:text-white">
                Teach<span className="text-blue-600 dark:text-blue-400">AI</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mb-6">
              Empowering educators with AI that knows your curriculum — answering student questions 24/7 from your own materials.
            </p>
            <div className="flex gap-3">
              {SOCIAL.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-4">
                {section}
              </h3>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="py-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            &copy; {year} TeachAI Inc. All rights reserved.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Made with care for educators everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
}
