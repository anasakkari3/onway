import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import FounderStorySection from '@/components/public/FounderStorySection';
import HeroRouteScene from '@/components/public/HeroRouteScene';
import LangSwitcher from '@/components/public/LangSwitcher';
import MobileStickyCTA from '@/components/public/MobileStickyCTA';
import PhoneVideoPlayer from '@/components/public/PhoneVideoPlayer';
import { getCurrentUser } from '@/lib/auth/session';
import { getPostAuthRedirectPath } from '@/lib/auth/onboarding';
import { dictionaries, type DictKey, Lang, translate } from '@/lib/i18n/dictionaries';

type LandingCopy = {
  trustLine: string;
  primaryAction: string;
  secondaryAction: string;
  signInAction: string;
  proof: string[];
  stepsEyebrow: string;
  stepsTitle: string;
  steps: { title: string; body: string }[];
  promiseEyebrow: string;
  promiseTitle: string;
  promiseBody: string;
  promises: { title: string; body: string }[];
  previewEyebrow: string;
  previewTitle: string;
  previewBody: string;
  subscriptionEyebrow: string;
  subscriptionTitle: string;
  subscriptionBody: string;
  subscriptionStats: { value: string; label: string; detail: string }[];
  subscriptionPlanTitle: string;
  subscriptionPlanPrice: string;
  subscriptionPlanBody: string;
  subscriptionPlanFeatures: string[];
  subscriptionAssumption: string;
  businessEyebrow: string;
  businessTitle: string;
  businessBody: string;
  businessPlans: { title: string; body: string }[];
  businessNoticeTitle: string;
  businessNoticeBody: string;
  finalTitle: string;
  finalBody: string;
};

const COPY: Record<Lang, LandingCopy> = {
  en: {
    trustLine: 'Community rides between cities, organized around people you already share context with.',
    primaryAction: 'Preview rides',
    secondaryAction: 'See how it works',
    signInAction: 'Sign in',
    proof: ['Community scoped', 'Driver trust signals', 'Simple ride coordination'],
    stepsEyebrow: 'A cleaner ride flow',
    stepsTitle: 'From route search to confirmed pickup without the usual back-and-forth',
    steps: [
      {
        title: 'Choose your community',
        body: 'Search and offers stay inside the right group, so every result starts with shared context.',
      },
      {
        title: 'Match the route',
        body: 'Find seats by origin, destination, timing, comfort filters, and the communities you joined.',
      },
      {
        title: 'Coordinate the ride',
        body: 'Use trip details, chat, status, and saved places to keep the ride clear until arrival.',
      },
    ],
    promiseEyebrow: 'Built for daily use',
    promiseTitle: 'A calmer way to move with your community',
    promiseBody: 'The experience is designed for students, young professionals, and local groups that need practical rides without messy chats and scattered posts.',
    promises: [
      {
        title: 'Trust feels visible',
        body: 'Ratings, completed drives, community context, and driver details stay close to the decision.',
      },
      {
        title: 'Search stays focused',
        body: 'The app keeps route discovery scoped instead of mixing every city, group, and ride together.',
      },
      {
        title: 'Posting is lightweight',
        body: 'Drivers can offer empty seats quickly while keeping the trip tied to the right community.',
      },
    ],
    previewEyebrow: 'Product rhythm',
    previewTitle: 'A mobile-first ride experience with the hard parts already organized',
    previewBody: 'The Remotion preview keeps the story moving while the live app handles matching, saved places, trip status, and coordination.',
    subscriptionEyebrow: 'Passenger subscription',
    subscriptionTitle: 'A simple monthly plan for passengers only',
    subscriptionBody: 'The normal subscription is designed for people booking seats, not riders who offer seats. A fair 20-40 NIS monthly range can replace small per-ride platform fees and keep the rider side attractive.',
    subscriptionStats: [
      {
        value: '17-58%',
        label: 'Passenger platform-fee saving',
        detail: 'Compared with paying 6 NIS on each of 8 monthly rides.',
      },
      {
        value: '2-9%',
        label: 'Passenger total monthly saving',
        detail: 'Including seats at an example average of 35 NIS per ride.',
      },
      {
        value: '+11%',
        label: 'Rider net income lift',
        detail: 'If riders keep the full seat price instead of a 10% rider commission.',
      },
    ],
    subscriptionPlanTitle: 'Passenger Basic',
    subscriptionPlanPrice: '20-40 NIS / month',
    subscriptionPlanBody: 'Unlimited passenger access during the month, no rider subscription, and a cleaner price experience before booking.',
    subscriptionPlanFeatures: [
      'Only passengers pay the monthly subscription',
      'Riders can keep offering seats without a monthly fee',
      'Good target price: 30 NIS for the first public plan',
      'No billing request until the plan is ready',
    ],
    subscriptionAssumption: 'Savings model: 8 rides/month, 35 NIS average seat price, 6 NIS passenger platform fee replaced by a 20-40 NIS subscription.',
    businessEyebrow: 'Business plan',
    businessTitle: 'A platform subscription for communities is coming',
    businessBody: 'The business plan is for campuses, workplaces, municipalities, and local communities that want organized shared rides with moderation, analytics, and private community controls.',
    businessPlans: [
      {
        title: 'Community launch',
        body: 'Private community setup, invite flow, route visibility, member moderation, and launch support.',
      },
      {
        title: 'Operations dashboard',
        body: 'Route demand insights, active ride trends, community growth signals, and safety review tools.',
      },
      {
        title: 'Partner support',
        body: 'Help with onboarding, pilot planning, communication materials, and monthly optimization.',
      },
    ],
    businessNoticeTitle: 'Coming soon: 2 months free',
    businessNoticeBody: 'After registration, platform partners get 2 months free. No billing details are requested right now.',
    finalTitle: 'Ready for the next ride?',
    finalBody: 'Start with your community, pick the route, and keep the coordination in one place.',
  },
  ar: {
    trustLine: 'رحلات مجتمعية بين المدن، منظمة حول ناس تشاركهم نفس السياق.',
    primaryAction: 'عاين الرحلات',
    secondaryAction: 'شاهد الطريقة',
    signInAction: 'تسجيل الدخول',
    proof: ['نطاق مجتمعي واضح', 'إشارات ثقة للسائق', 'تنسيق رحلة بسيط'],
    stepsEyebrow: 'تدفق أنظف للرحلة',
    stepsTitle: 'من البحث عن المسار إلى نقطة الالتقاء بدون فوضى الرسائل المعتادة',
    steps: [
      {
        title: 'اختر المجتمع',
        body: 'البحث والعروض تبقى داخل المجموعة الصحيحة، حتى تبدأ كل نتيجة بسياق مشترك.',
      },
      {
        title: 'طابق المسار',
        body: 'ابحث عن مقعد حسب نقطة الانطلاق، الوجهة، الوقت، الراحة، والمجتمعات التي انضممت إليها.',
      },
      {
        title: 'نسق الرحلة',
        body: 'تفاصيل الرحلة، الدردشة، الحالة، والأماكن المحفوظة تبقي كل شيء واضحاً حتى الوصول.',
      },
    ],
    promiseEyebrow: 'مصمم للاستخدام اليومي',
    promiseTitle: 'طريقة أهدأ للتنقل مع مجتمعك',
    promiseBody: 'التجربة مناسبة للطلاب، الشباب، والمجموعات المحلية التي تحتاج رحلات عملية بدون فوضى محادثات ومنشورات متناثرة.',
    promises: [
      {
        title: 'الثقة ظاهرة',
        body: 'التقييمات، الرحلات المكتملة، سياق المجتمع، وتفاصيل السائق قريبة من قرار الحجز.',
      },
      {
        title: 'البحث مركز',
        body: 'التطبيق يحافظ على اكتشاف الرحلات داخل النطاق الصحيح بدل خلط كل المدن والمجموعات.',
      },
      {
        title: 'النشر خفيف',
        body: 'السائق يقدر يعرض المقاعد الفارغة بسرعة مع إبقاء الرحلة مرتبطة بالمجتمع المناسب.',
      },
    ],
    previewEyebrow: 'إيقاع المنتج',
    previewTitle: 'تجربة موبايل أولا، والجزء المتعب منظم مسبقاً',
    previewBody: 'معاينة Remotion تعرض القصة بحركة خفيفة، بينما التطبيق الحقيقي يتولى المطابقة، الأماكن المحفوظة، حالة الرحلة، والتنسيق.',
    subscriptionEyebrow: 'اشتراك الركاب',
    subscriptionTitle: 'خطة شهرية بسيطة للركاب فقط',
    subscriptionBody: 'الاشتراك العادي مخصص لمن يحجزون مقاعد، وليس للسائقين الذين يعرضون المقاعد. نطاق 20-40 شيكل شهرياً يمكن أن يستبدل رسوم المنصة الصغيرة لكل رحلة ويحافظ على جاذبية التطبيق للسائقين.',
    subscriptionStats: [
      {
        value: '17-58%',
        label: 'توفير رسوم المنصة للراكب',
        detail: 'مقارنة بدفع 6 شيكل على كل واحدة من 8 رحلات شهرية.',
      },
      {
        value: '2-9%',
        label: 'توفير شهري إجمالي للراكب',
        detail: 'يشمل المقاعد بمتوسط مثال 35 شيكل لكل رحلة.',
      },
      {
        value: '+11%',
        label: 'زيادة صافي دخل السائق',
        detail: 'إذا احتفظ السائق بسعر المقعد كاملاً بدل عمولة 10%.',
      },
    ],
    subscriptionPlanTitle: 'Passenger Basic',
    subscriptionPlanPrice: '20-40 شيكل / شهر',
    subscriptionPlanBody: 'وصول غير محدود للركاب خلال الشهر، بدون اشتراك للسائق، وتجربة سعر أوضح قبل الحجز.',
    subscriptionPlanFeatures: [
      'الاشتراك الشهري على الركاب فقط',
      'السائقون يستطيعون عرض المقاعد بدون رسوم شهرية',
      'السعر المقترح لأول خطة عامة: 30 شيكل',
      'لن نطلب بيانات دفع حتى تصبح الخطة جاهزة',
    ],
    subscriptionAssumption: 'نموذج التوفير: 8 رحلات شهرياً، 35 شيكل متوسط سعر المقعد، واستبدال رسوم راكب 6 شيكل باشتراك 20-40 شيكل.',
    businessEyebrow: 'خطة الأعمال',
    businessTitle: 'اشتراك منصة للمجتمعات قريباً',
    businessBody: 'خطة الأعمال مخصصة للجامعات، أماكن العمل، البلديات، والمجتمعات المحلية التي تريد رحلات مشتركة منظمة مع إشراف، إحصاءات، وتحكم خاص بالمجتمع.',
    businessPlans: [
      {
        title: 'إطلاق المجتمع',
        body: 'إعداد مجتمع خاص، دعوات، ظهور المسارات، إدارة الأعضاء، ودعم الإطلاق.',
      },
      {
        title: 'لوحة تشغيل',
        body: 'رؤى عن طلب المسارات، اتجاهات الرحلات النشطة، نمو المجتمع، وأدوات مراجعة السلامة.',
      },
      {
        title: 'دعم الشركاء',
        body: 'مساعدة في الانضمام، تخطيط التجربة، مواد التواصل، وتحسين شهري.',
      },
    ],
    businessNoticeTitle: 'قريباً: شهران مجاناً',
    businessNoticeBody: 'بعد التسجيل، يحصل شركاء المنصة على شهرين مجاناً. لا نطلب أي بيانات دفع الآن.',
    finalTitle: 'جاهز للرحلة القادمة؟',
    finalBody: 'ابدأ من مجتمعك، اختر المسار، وخلي التنسيق في مكان واحد.',
  },
  he: {
    trustLine: 'נסיעות קהילתיות בין ערים, מאורגנות סביב אנשים שכבר חולקים איתך הקשר.',
    primaryAction: 'לצפות בנסיעות',
    secondaryAction: 'איך זה עובד',
    signInAction: 'כניסה',
    proof: ['תחום קהילה ברור', 'סימני אמון לנהג', 'תיאום נסיעה פשוט'],
    stepsEyebrow: 'זרימת נסיעה נקייה יותר',
    stepsTitle: 'מחיפוש מסלול ועד נקודת איסוף בלי הלוך ושוב מיותר',
    steps: [
      {
        title: 'בחרו קהילה',
        body: 'חיפוש והצעות נשארים בתוך הקבוצה הנכונה, כך שכל תוצאה מתחילה מהקשר משותף.',
      },
      {
        title: 'התאימו מסלול',
        body: 'מצאו מושב לפי מוצא, יעד, זמן, העדפות נוחות והקהילות שאליהן הצטרפתם.',
      },
      {
        title: 'תאמו את הנסיעה',
        body: 'פרטי נסיעה, צ׳אט, סטטוס ומקומות שמורים משאירים הכל ברור עד ההגעה.',
      },
    ],
    promiseEyebrow: 'נבנה לשימוש יומיומי',
    promiseTitle: 'דרך רגועה יותר לנוע עם הקהילה שלך',
    promiseBody: 'החוויה מתאימה לסטודנטים, צעירים וקבוצות מקומיות שצריכות נסיעות מעשיות בלי צ׳אטים מבולגנים ופוסטים מפוזרים.',
    promises: [
      {
        title: 'אמון נשאר גלוי',
        body: 'דירוגים, נסיעות שהושלמו, הקשר קהילתי ופרטי הנהג קרובים לרגע ההחלטה.',
      },
      {
        title: 'החיפוש נשאר ממוקד',
        body: 'האפליקציה שומרת על גילוי נסיעות בתחום הנכון במקום לערבב ערים וקבוצות.',
      },
      {
        title: 'פרסום נסיעה קל',
        body: 'נהגים יכולים להציע מושבים פנויים במהירות ולשמור את הנסיעה בקהילה המתאימה.',
      },
    ],
    previewEyebrow: 'קצב המוצר',
    previewTitle: 'חוויה מוביילית שבה החלקים הקשים כבר מסודרים',
    previewBody: 'תצוגת Remotion מספרת את הסיפור בתנועה עדינה, והאפליקציה מטפלת בהתאמה, מקומות שמורים, סטטוס ותיאום.',
    subscriptionEyebrow: 'מנוי לנוסעים',
    subscriptionTitle: 'תוכנית חודשית פשוטה לנוסעים בלבד',
    subscriptionBody: 'המנוי הרגיל מיועד לאנשים שמזמינים מושבים, לא לנהגים שמציעים מושבים. טווח הוגן של 20-40 ש"ח בחודש יכול להחליף עמלות קטנות לכל נסיעה ולשמור על צד הנהגים אטרקטיבי.',
    subscriptionStats: [
      {
        value: '17-58%',
        label: 'חיסכון בעמלת פלטפורמה לנוסע',
        detail: 'בהשוואה לתשלום 6 ש"ח בכל אחת מ-8 נסיעות חודשיות.',
      },
      {
        value: '2-9%',
        label: 'חיסכון חודשי כולל לנוסע',
        detail: 'כולל מושבים במחיר דוגמה ממוצע של 35 ש"ח לנסיעה.',
      },
      {
        value: '+11%',
        label: 'עלייה בנטו לנהג',
        detail: 'אם הנהג שומר את מחיר המושב המלא במקום עמלת נהג של 10%.',
      },
    ],
    subscriptionPlanTitle: 'Passenger Basic',
    subscriptionPlanPrice: '20-40 ש"ח / חודש',
    subscriptionPlanBody: 'גישה בלתי מוגבלת לנוסעים במהלך החודש, ללא מנוי לנהגים, וחוויית מחיר נקייה יותר לפני הזמנה.',
    subscriptionPlanFeatures: [
      'רק נוסעים משלמים את המנוי החודשי',
      'נהגים יכולים להציע מושבים ללא תשלום חודשי',
      'מחיר יעד טוב לתוכנית הציבורית הראשונה: 30 ש"ח',
      'לא נבקש פרטי חיוב עד שהתוכנית תהיה מוכנה',
    ],
    subscriptionAssumption: 'מודל החיסכון: 8 נסיעות בחודש, מחיר מושב ממוצע 35 ש"ח, ועמלת נוסע של 6 ש"ח שמוחלפת במנוי 20-40 ש"ח.',
    businessEyebrow: 'תוכנית עסקית',
    businessTitle: 'מנוי פלטפורמה לקהילות יגיע בקרוב',
    businessBody: 'התוכנית העסקית מיועדת לקמפוסים, מקומות עבודה, רשויות וקהילות מקומיות שרוצות נסיעות שיתופיות מאורגנות עם ניהול, נתונים ובקרות קהילה פרטיות.',
    businessPlans: [
      {
        title: 'השקת קהילה',
        body: 'הקמת קהילה פרטית, הזמנות, נראות מסלולים, ניהול חברים ותמיכה בהשקה.',
      },
      {
        title: 'לוח תפעול',
        body: 'תובנות ביקוש למסלולים, מגמות נסיעות פעילות, אותות צמיחת קהילה וכלי בדיקת בטיחות.',
      },
      {
        title: 'תמיכת שותפים',
        body: 'עזרה באונבורדינג, תכנון פיילוט, חומרי תקשורת ואופטימיזציה חודשית.',
      },
    ],
    businessNoticeTitle: 'בקרוב: חודשיים חינם',
    businessNoticeBody: 'לאחר ההרשמה, שותפי הפלטפורמה מקבלים חודשיים בחינם. לא נבקש פרטי חיוב כרגע.',
    finalTitle: 'מוכנים לנסיעה הבאה?',
    finalBody: 'מתחילים מהקהילה, בוחרים מסלול ושומרים את התיאום במקום אחד.',
  },
};

export default async function PublicLandingPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(await getPostAuthRedirectPath(user.id));
  }

  const cookieStore = await cookies();
  const langValue = cookieStore.get('NEXT_LOCALE')?.value as Lang | undefined;
  const lang: Lang = langValue || 'ar';
  const dict = dictionaries[lang] || dictionaries.en;
  const t = (key: DictKey) => translate(dict, key);
  const copy = COPY[lang] || COPY.en;

  return (
    <div className="public-shell min-h-screen font-sans text-[var(--foreground)]">
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
            <Link href="/login" className="hidden rounded-lg px-4 py-2.5 text-sm font-bold text-[var(--muted-strong)] transition-colors hover:text-[var(--foreground)] sm:inline-flex">
              {copy.signInAction}
            </Link>
            <Link href="/preview" className="btn-primary min-h-11 rounded-lg px-4 py-2.5 text-sm font-black shadow-md sm:px-5">
              {copy.primaryAction}
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-16">
        <section className="landing-hero relative overflow-hidden px-4">
          <HeroRouteScene />
          <div className="relative z-10 mx-auto grid h-full max-w-7xl items-center gap-8 py-12 lg:py-14">
            <div className="landing-hero-copy max-w-3xl">
              <p className="landing-kicker animate-fade-in-up stagger-1">{copy.trustLine}</p>
              <h1 className="landing-hero-title display-title animate-fade-in-up stagger-2">
                {t('landing_hero_title')}
              </h1>
              <p className="mt-5 max-w-2xl animate-fade-in-up stagger-3 text-base leading-relaxed text-white/80 sm:text-lg">
                {t('landing_hero_subtitle')}
              </p>
              <div className="mt-8 flex animate-fade-in-up stagger-4">
                <Link href="/preview" className="landing-cta">
                  {copy.primaryAction}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-trust-row px-4">
          <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-3">
            {copy.proof.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>

        <section id="flow" className="landing-section px-4">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="landing-eyebrow">{copy.stepsEyebrow}</p>
              <h2 className="landing-headline display-title">{copy.stepsTitle}</h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {copy.steps.map((step, index) => (
                <article key={step.title} className="landing-step">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section landing-section--muted px-4">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="landing-eyebrow">{copy.promiseEyebrow}</p>
              <h2 className="landing-headline display-title">{copy.promiseTitle}</h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--muted-strong)] sm:text-lg">
                {copy.promiseBody}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {copy.promises.map((promise) => (
                <article key={promise.title} className="landing-panel">
                  <h3>{promise.title}</h3>
                  <p>{promise.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section px-4">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <p className="landing-eyebrow">{copy.subscriptionEyebrow}</p>
              <h2 className="landing-headline display-title">{copy.subscriptionTitle}</h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--muted-strong)] sm:text-lg">
                {copy.subscriptionBody}
              </p>
              <p className="mt-5 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-raised)] p-4 text-sm font-bold leading-relaxed text-[var(--muted-strong)]">
                {copy.subscriptionAssumption}
              </p>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {copy.subscriptionStats.map((stat) => (
                  <article key={stat.label} className="landing-stat-card">
                    <strong>{stat.value}</strong>
                    <h3>{stat.label}</h3>
                    <p>{stat.detail}</p>
                  </article>
                ))}
              </div>

              <article className="landing-plan-card">
                <div>
                  <p>{copy.subscriptionPlanTitle}</p>
                  <h3>{copy.subscriptionPlanPrice}</h3>
                  <span>{copy.subscriptionPlanBody}</span>
                </div>
                <ul>
                  {copy.subscriptionPlanFeatures.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="landing-section landing-section--muted px-4">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
              <div>
                <p className="landing-eyebrow">{copy.businessEyebrow}</p>
                <h2 className="landing-headline display-title">{copy.businessTitle}</h2>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--muted-strong)] sm:text-lg">
                  {copy.businessBody}
                </p>
              </div>
              <div className="landing-business-notice">
                <span>{copy.businessNoticeTitle}</span>
                <p>{copy.businessNoticeBody}</p>
              </div>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {copy.businessPlans.map((plan) => (
                <article key={plan.title} className="landing-panel">
                  <h3>{plan.title}</h3>
                  <p>{plan.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <FounderStorySection />

        <section className="landing-section px-4">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="landing-eyebrow">{copy.previewEyebrow}</p>
              <h2 className="landing-headline display-title">{copy.previewTitle}</h2>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--muted-strong)] sm:text-lg">
                {copy.previewBody}
              </p>
            </div>

            <div className="landing-phone-stage">
              <div className="phone-shell-pro">
                <div className="phone-shell-pro__notch" />
                <div className="phone-shell-pro__screen">
                  <PhoneVideoPlayer />
                </div>
                <div className="phone-shell-pro__home" />
              </div>
            </div>
          </div>
        </section>

        <section className="landing-final px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="display-title">{copy.finalTitle}</h2>
            <p>{copy.finalBody}</p>
            <Link href="/preview" className="landing-cta landing-cta--light">
              {copy.primaryAction}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border-soft)] bg-[var(--surface)] px-4 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-7 md:flex-row">
          <BrandLogo lang={lang} size="footer" className="opacity-90" />
          <div className="flex gap-6 text-sm font-semibold text-[var(--muted)]">
            <Link href="/privacy" className="transition-colors hover:text-[var(--foreground)]">{t('footer_privacy')}</Link>
            <Link href="/terms" className="transition-colors hover:text-[var(--foreground)]">{t('footer_terms')}</Link>
            <Link href="/contact" className="transition-colors hover:text-[var(--foreground)]">{t('footer_contact')}</Link>
          </div>
          <p className="text-xs text-[var(--muted)]">
            {t('copyright')} {new Date().getFullYear()} {t('ride_match')}. {t('all_rights_reserved')}
          </p>
        </div>
      </footer>

      <MobileStickyCTA href="/preview" label={copy.primaryAction} />
    </div>
  );
}
