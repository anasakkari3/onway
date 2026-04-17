import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import HeroRouteScene from '@/components/public/HeroRouteScene';
import LangSwitcher from '@/components/public/LangSwitcher';
import PreviewExperience from './PreviewExperience';
import { getCurrentUser } from '@/lib/auth/session';
import { getPostAuthRedirectPath } from '@/lib/auth/onboarding';
import { dictionaries, type DictKey, Lang, translate } from '@/lib/i18n/dictionaries';
import { getPreviewRides, PREVIEW_COPY } from '@/lib/preview/rides';

export default async function PreviewPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(await getPostAuthRedirectPath(user.id));
  }

  const cookieStore = await cookies();
  const langValue = cookieStore.get('NEXT_LOCALE')?.value as Lang | undefined;
  const lang: Lang = langValue || 'ar';
  const dict = dictionaries[lang] || dictionaries.en;
  const t = (key: DictKey) => translate(dict, key);
  const copy = PREVIEW_COPY[lang] || PREVIEW_COPY.en;
  const previewRides = getPreviewRides(lang);

  return (
    <div className="public-shell preview-shell min-h-screen font-sans text-[var(--foreground)]">
      <header className="public-nav fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex min-w-0 shrink-0 items-center rounded-lg max-w-[48vw] sm:max-w-none"
            aria-label={t('home')}
          >
            <BrandLogo
              lang={lang}
              size="nav"
              priority
              className="transition-transform duration-200 group-hover:scale-[1.02]"
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <LangSwitcher current={lang} />
            <Link href="/login?mode=signup&next=%2Fapp" className="btn-primary hidden min-h-11 rounded-lg px-4 py-2.5 text-sm font-black shadow-md sm:inline-flex">
              {copy.navCta}
            </Link>
          </div>
        </div>
      </header>

      <div className="preview-bg" aria-hidden="true">
        <HeroRouteScene />
      </div>

      <div className="relative z-10 pt-16">
        <PreviewExperience rides={previewRides} copy={copy} />
      </div>
    </div>
  );
}
