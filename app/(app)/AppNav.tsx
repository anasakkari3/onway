'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import BrandLogo from '@/components/BrandLogo';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

type NavItem = {
  key: 'home' | 'rides' | 'post' | 'chat' | 'profile';
  href: string;
  label: string;
  mobileLabel: string;
  ariaLabel: string;
  icon: ReactNode;
  emphasis?: boolean;
};

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.8V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.8" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

function RidesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 16h14" />
      <path d="M6.5 16 8 9.5A2 2 0 0 1 10 8h4a2 2 0 0 1 2 1.5l1.5 6.5" />
      <path d="M7 19h.01" />
      <path d="M17 19h.01" />
      <path d="M4 13h2" />
      <path d="M18 13h2" />
    </svg>
  );
}

function PostIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 14a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

function isItemActive(pathname: string, item: NavItem) {
  if (item.key === 'home') {
    return pathname === '/app' || pathname.startsWith('/search');
  }

  if (item.key === 'rides') {
    return (
      pathname.startsWith('/trips/my-rides') ||
      (pathname.startsWith('/trips/') &&
        !pathname.startsWith('/trips/new') &&
        !pathname.includes('/chat'))
    );
  }

  if (item.key === 'post') {
    return pathname.startsWith('/trips/new');
  }

  if (item.key === 'chat') {
    return pathname === '/messages' || pathname.includes('/chat');
  }

  return pathname.startsWith('/profile');
}

export default function AppNav() {
  const pathname = usePathname();
  const { lang, t } = useTranslation();
  const navLabel =
    lang === 'ar'
      ? 'التنقل الرئيسي'
      : lang === 'he'
        ? 'ניווט ראשי'
        : 'Primary navigation';
  const alertsLabel = t('notifications_nav');
  const postMobileLabel =
    lang === 'ar' ? 'قدّم' : lang === 'he' ? 'הצע' : 'Post';

  const navItems: NavItem[] = [
    {
      key: 'home',
      href: '/app',
      label: t('home'),
      mobileLabel: t('home'),
      ariaLabel: t('home'),
      icon: <HomeIcon />,
    },
    {
      key: 'rides',
      href: '/trips/my-rides',
      label: t('my_rides'),
      mobileLabel: t('my_rides'),
      ariaLabel: t('my_rides'),
      icon: <RidesIcon />,
    },
    {
      key: 'post',
      href: '/trips/new',
      label: t('offer_ride'),
      mobileLabel: postMobileLabel,
      ariaLabel: t('offer_ride'),
      icon: <PostIcon />,
      emphasis: true,
    },
    {
      key: 'chat',
      href: '/messages',
      label: t('messages_nav'),
      mobileLabel: t('messages_nav'),
      ariaLabel: t('messages_nav'),
      icon: <ChatIcon />,
    },
    {
      key: 'profile',
      href: '/profile',
      label: t('profile'),
      mobileLabel: t('profile'),
      ariaLabel: t('profile'),
      icon: <ProfileIcon />,
    },
  ];

  const isAlertsActive = pathname.startsWith('/notifications');

  return (
    <>
      <header className="app-top-nav fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl">
        <div className="app-top-nav__inner">
          <Link
            href="/app"
            className="app-top-nav__brand group"
            aria-label={t('home')}
          >
            <BrandLogo
              lang={lang}
              size="nav"
              className="transition-transform duration-200 group-hover:scale-[1.02]"
            />
          </Link>

          <nav aria-label={navLabel} className="app-top-nav__links">
            {navItems.map((item) => {
              const active = isItemActive(pathname, item);

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-label={item.ariaLabel}
                  aria-current={active ? 'page' : undefined}
                  className={`app-top-nav__link nav-link ${active ? 'is-active' : ''} ${item.emphasis ? 'is-emphasis' : ''}`}
                >
                  <span className="app-nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <Link
            href="/notifications"
            aria-label={alertsLabel}
            aria-current={isAlertsActive ? 'page' : undefined}
            className={`app-top-nav__alert nav-link ${isAlertsActive ? 'is-active' : ''}`}
          >
            <span className="app-nav-icon"><BellIcon /></span>
            <span className="app-top-nav__alert-label">{alertsLabel}</span>
          </Link>
        </div>
      </header>

      <nav aria-label={navLabel} className="app-bottom-nav md:hidden">
        <div className="app-bottom-nav__inner">
          {navItems.map((item) => {
            const active = isItemActive(pathname, item);

            return (
              <Link
                key={item.key}
                href={item.href}
                aria-label={item.ariaLabel}
                aria-current={active ? 'page' : undefined}
                className={`app-bottom-nav__item nav-link ${active ? 'is-active' : ''} ${item.emphasis ? 'is-emphasis' : ''}`}
              >
                <span className="app-bottom-nav__icon">{item.icon}</span>
                <span className="app-bottom-nav__label">{item.mobileLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
