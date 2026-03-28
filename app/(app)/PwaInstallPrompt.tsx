'use client';

import { useState, useEffect } from 'react';

import { useTranslation } from '@/lib/i18n/LanguageProvider';

export default function PwaInstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<{ outcome: string }> } | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as { prompt: () => Promise<{ outcome: string }> });
      const key = 'ride-match-pwa-dismissed';
      if (typeof window !== 'undefined' && !sessionStorage.getItem(key)) {
        setShowPrompt(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setShowPrompt(false);
    setDismissed(true);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    if (typeof window !== 'undefined') sessionStorage.setItem('ride-match-pwa-dismissed', '1');
  };

  if (!showPrompt || dismissed || !deferredPrompt) return null;

  return (
    <div className="mb-4 rounded-lg border border-sky-200 dark:border-slate-800 bg-sky-50 dark:bg-slate-900 p-3 text-sm text-sky-900 dark:text-slate-100">
      <p className="font-medium">{t('install_ride_match')}</p>
      <p className="mt-1 text-sky-700 dark:text-sky-400">{t('add_to_home_screen')}</p>
      <div className="mt-2 flex gap-2">
        <button
          onClick={handleInstall}
          className="rounded bg-sky-600 dark:bg-sky-500 px-3 py-1.5 text-white hover:bg-sky-700 dark:hover:bg-sky-600 transition-colors btn-press"
        >
          {t('install')}
        </button>
        <button onClick={handleDismiss} className="text-sky-600 dark:text-sky-400 hover:underline transition-colors btn-press">
          {t('not_now')}
        </button>
      </div>
    </div>
  );
}
