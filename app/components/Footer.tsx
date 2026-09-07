import Link from 'next/link';
import Image from 'next/image';

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '/#features' },
    { label: 'How it Works', href: '/#how-it-works' },
    { label: 'B2B / Institutions', href: '/#b2b' },
    { label: 'FAQ', href: '/#faq' },
  ],
  Dashboard: [
    { label: 'Overview', href: '/dashboard' },
    { label: 'Ask AI', href: '/dashboard/chat' },
    { label: 'Subjects', href: '/dashboard/subjects' },
    { label: 'File Management', href: '/dashboard/files' },
    { label: 'Students', href: '/dashboard/students' },
    { label: 'Analytics', href: '/dashboard/analytics' },
  ],
  Account: [
    { label: 'Sign In', href: '/login' },
    { label: 'Create Account', href: '/signup' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
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
              <Image src="/light_logo.png" alt="VTA" width={32} height={32} className="rounded-lg block dark:hidden" />
              <Image src="/dark-logo.png" alt="VTA" width={32} height={32} className="rounded-lg hidden dark:block" />
              <span className="font-bold text-xl text-slate-900 dark:text-white">
                VTA
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mb-6">
              A high-precision RAG research project for automated curriculum intelligence. Sponsored by NVIDIA and designed to empower educators with AI that knows your materials.
            </p>
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">📧</span>
                parteek.bhatia@gmail.com
              </div>
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
            &copy; {year} VTA — Virtual Teaching Assistant. All rights reserved.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Made with care for educators everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
}
