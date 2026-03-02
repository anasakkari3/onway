'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/', label: 'Home' },
  { href: '/search', label: 'Search' },
  { href: '/profile', label: 'Profile' },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-slate-200 bg-white py-2 safe-area-pb md:relative md:border-0 md:bg-transparent md:py-0">
      {nav.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`rounded-lg px-4 py-2 text-sm font-medium md:px-3 md:py-1.5 ${
            pathname === href
              ? 'bg-sky-100 text-sky-700 md:bg-sky-600 md:text-white'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hover:bg-slate-200'
          }`}
        >
          {label}
        </Link>
      ))}
      <Link
        href="/admin/analytics"
        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 md:px-3 md:py-1.5"
      >
        Admin
      </Link>
    </nav>
  );
}
