'use client';

import Image from 'next/image';
import { BRAND_NAME, brandCopy } from '@/lib/brand/config';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import type { Lang } from '@/lib/i18n/dictionaries';

type FounderCopy = {
  eyebrow: string;
  title: string;
  story: string[];
  nameNote: string;
  whyTitle: string;
  whyQuote: string;
  role: string;
  focus: string;
  tags: string[];
  cta: string;
  footnote: string;
};

const COPY: Record<Lang, FounderCopy> = {
  en: {
    eyebrow: 'About the founder',
    title: 'Built from a real problem people were already dealing with every day',
    story: [
      `Anas Akkari started ${BRAND_NAME} after watching the same issue repeat itself around him: students and young people trying to coordinate rides between cities without a simple system that actually fit how local communities move.`,
      `The existing options often felt too complicated, too unsafe, or too generic for the way people really organize travel in their own circles. ${BRAND_NAME} was built to make that process feel simple, organized, and trustworthy from the start.`,
    ],
    nameNote: `The Arabic idea behind the brand, ${BRAND_NAME}, carries both the feeling of being on your way and the visual personality that can grow into a distinctive identity over time.`,
    whyTitle: 'Why I built it',
    whyQuote: '"This was never just a startup concept. It came from a daily frustration: people already needed rides, but the process around finding them and organizing them was messy. I wanted to build something people could actually use without friction and trust without feeling out of place."',
    role: `Founder, ${BRAND_NAME}`,
    focus: 'Focused on building a better way for real communities to coordinate shared travel between cities.',
    tags: ['Community-first', 'Simple coordination', 'Trust by design'],
    cta: 'Connect with me on LinkedIn',
    footnote: 'A founder story grounded in the product problem, not inflated claims.',
  },
  ar: {
    eyebrow: 'عن المؤسس',
    title: 'بدأت من مشكلة يومية يعاني منها الكثير.',
    story: [
      'بدأ أنس العكاري هذا المشروع بعد أن رأى نفس المشكلة تتكرر حوله: طلاب وشباب يحاولون تنسيق رحلات بين المدن من دون نظام بسيط يناسب فعلاً طريقة حركة المجتمعات المحلية.',
      'الخيارات الموجودة كانت غالباً معقّدة أكثر من اللازم، أو غير مطمئنة، أو غير مناسبة لطريقة تنظيم الناس لرحلاتهم داخل دوائرهم. لذلك بُنيت بطريقك لتجعل العملية أبسط وأكثر ترتيباً وأكثر ثقة منذ البداية.',
    ],
    nameNote: 'فكرة الاسم بطريقك تحمل معنى الطريق والمسار، وفي الوقت نفسه تفتح باباً لهوية بصرية مميزة يمكن أن تكبر مع المنتج لاحقاً.',
    whyTitle: 'لماذا بنيته',
    whyQuote: '"لم تكن الفكرة مجرد مشروع ناشئ. كانت نابعة من مشكلة يومية: الناس يحتاجون إلى رحلات فعلاً، لكن طريقة البحث عنها وتنظيمها كانت فوضوية. أردت أن أبني شيئاً يمكن للناس استخدامه بسهولة ويثقوا به من دون أن يشعروا أنه غريب عنهم."',
    role: 'المؤسس، بطريقك',
    focus: 'أركّز على بناء طريقة أفضل لمجتمعات حقيقية تنسّق السفر المشترك بين المدن.',
    tags: ['مجتمع موثوق', 'تنظيم بسيط', 'تجربة واضحة'],
    cta: 'تواصل معي على لينكدإن',
    footnote: 'قصة مؤسس مرتبطة بمشكلة المنتج الحقيقية، لا بادعاءات مبالغ فيها.',
  },
  he: {
    eyebrow: 'על המייסד',
    title: 'נבנה מתוך בעיה אמיתית שאנשים כבר חיו איתה כל יום',
    story: [
      'אנאס אכארי התחיל את הפרויקט אחרי שראה שוב ושוב את אותה בעיה: סטודנטים וצעירים שמנסים לתאם נסיעות בין ערים בלי מערכת פשוטה שבאמת מתאימה לאופן שבו קהילות מקומיות זזות ומתארגנות.',
      `הפתרונות הקיימים הרגישו לעיתים קרובות מסובכים מדי, לא בטוחים מספיק, או פשוט לא מותאמים לאופן שבו אנשים מתאמים נסיעות בתוך המעגלים שלהם. לכן ${BRAND_NAME} נבנתה כדי להפוך את התהליך לפשוט, מסודר ואמין יותר מההתחלה.`,
    ],
    nameNote: `הרעיון הערבי שמאחורי המותג, ${BRAND_NAME}, מחזיק גם את תחושת הדרך והמסלול וגם פוטנציאל לזהות חזותית ייחודית שיכולה להתפתח עם הזמן.`,
    whyTitle: 'למה בניתי את זה',
    whyQuote: '"זו אף פעם לא הייתה רק מחשבת סטארטאפ. זה בא מתוך תסכול יומיומי: אנשים באמת היו צריכים נסיעות, אבל הדרך למצוא אותן ולארגן אותן הייתה מבולגנת. רציתי לבנות משהו שאנשים באמת ישתמשו בו בלי חיכוך ויוכלו לסמוך עליו בלי להרגיש שהוא לא נבנה בשבילם."',
    role: `המייסד, ${BRAND_NAME}`,
    focus: 'ממוקד בבניית דרך טובה יותר לקהילות אמיתיות לתאם נסיעות משותפות בין ערים.',
    tags: ['קהילה תחילה', 'תיאום פשוט', 'אמון בעיצוב'],
    cta: 'התחברו אליי בלינקדאין',
    footnote: 'סיפור מייסד שמבוסס על בעיית המוצר האמיתית, לא על הישגים מומצאים.',
  },
};

export default function FounderStorySection() {
  const { lang } = useTranslation();
  const copy = brandCopy(COPY[lang]);

  return (
    <section className="landing-section bg-[var(--surface)] px-4">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="landing-eyebrow mb-4">
                {copy.eyebrow}
              </p>
              <h2 className="display-title max-w-3xl text-3xl font-black text-[var(--foreground)] sm:text-5xl">
                {copy.title}
              </h2>
              <div className="mt-6 space-y-4 max-w-3xl">
                {copy.story.map((paragraph) => (
                  <p key={paragraph} className="text-base leading-relaxed text-[var(--muted-strong)] sm:text-lg">
                    {paragraph}
                  </p>
                ))}
              </div>
              <p className="mt-4 max-w-3xl text-sm font-bold text-[var(--primary)] sm:text-base">
                {copy.nameNote}
              </p>

              <div className="soft-panel mt-8 rounded-lg p-5">
                <p className="mb-2 text-xs font-black text-[var(--primary)]">
                  {copy.whyTitle}
                </p>
                <p className="text-sm leading-relaxed text-[var(--muted-strong)] sm:text-base">
                  {copy.whyQuote}
                </p>
              </div>
            </div>

            <div className="surface-card flex flex-col justify-center rounded-lg p-5 sm:p-6">
              <div className="overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-muted)] shadow-sm">
                <Image
                  src="/brand/founder-anas.jpeg"
                  alt="Anas Akkari"
                  width={720}
                  height={960}
                  priority
                  className="h-[340px] w-full object-cover object-top"
                />
              </div>

              <p className="mt-5 text-xl font-black text-[var(--foreground)]">Anas Akkari</p>
              <p className="mt-1 text-sm font-bold text-[var(--muted)]">
                {copy.role}
              </p>
              <p className="mt-5 text-sm leading-relaxed text-[var(--muted-strong)] sm:text-base">
                {copy.focus}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {copy.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-raised)] px-3 py-1 text-xs font-bold text-[var(--muted-strong)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <a
                href="https://www.linkedin.com/in/anas-akkari-ba684b369"
                target="_blank"
                rel="noreferrer"
                className="btn-press mt-8 inline-flex w-fit items-center gap-2 rounded-lg bg-[var(--route-ink)] px-5 py-3 text-sm font-black text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)]"
              >
                {copy.cta}
                <span aria-hidden="true">↗</span>
              </a>

              <p className="mt-3 text-xs text-[var(--muted)]">
                {copy.footnote}
              </p>
            </div>
          </div>
      </div>
    </section>
  );
}
