import type { Lang } from '@/lib/i18n/dictionaries';

export type PreviewRide = {
  id: string;
  origin: string;
  destination: string;
  timeLabel: string;
  dayLabel: string;
  seatsAvailable: number;
  priceLabel: string;
  driverName: string;
  communityName: string;
  passengerInitials: string[];
  activityHint: string;
  urgency?: string;
  trustLine: string;
  detailNote: string;
};

export type PreviewCopy = {
  navCta: string;
  heroEyebrow: string;
  heroTitle: string;
  heroBody: string;
  hint: string;
  highlightedLabel: string;
  viewRide: string;
  joinNow: string;
  continueBrowsing: string;
  loadMore: string;
  previewMode: string;
  lockedBooking: string;
  lockedMessage: string;
  routeMapLabel: string;
  routeCount: string;
  ridesNearby: string;
  seatsLeft: string;
  onlySeatLeft: string;
  loadingTitle: string;
  emptyTitle: string;
  emptyBody: string;
  errorTitle: string;
  errorBody: string;
};

export const PREVIEW_COPY: Record<Lang, PreviewCopy> = {
  en: {
    navCta: 'Join now',
    heroEyebrow: 'Live preview',
    heroTitle: 'Here are rides happening around you',
    heroBody: 'Browse first. Join only when you are ready to book, message, or save a route.',
    hint: 'Browse rides freely — join to book or message',
    highlightedLabel: 'Suggested now',
    viewRide: 'View ride',
    joinNow: 'Join now',
    continueBrowsing: 'Continue browsing',
    loadMore: 'Load more',
    previewMode: 'Preview mode',
    lockedBooking: 'Join to book this seat',
    lockedMessage: 'Join to message the driver',
    routeMapLabel: 'Route activity preview',
    routeCount: '{count} routes',
    ridesNearby: 'Rides you can scan now',
    seatsLeft: '{count} seats left',
    onlySeatLeft: 'Only 1 seat left',
    loadingTitle: 'Loading rides',
    emptyTitle: 'No rides on this route yet',
    emptyBody: 'Try another route or create one.',
    errorTitle: 'Rides did not load',
    errorBody: 'We could not load rides right now. Try again in a moment.',
  },
  ar: {
    navCta: 'انضم الآن',
    heroEyebrow: 'معاينة حية',
    heroTitle: 'هذه رحلات قريبة تحدث الآن',
    heroBody: 'تصفح أولاً. انضم فقط عندما تريد الحجز، مراسلة السائق، أو حفظ مسار.',
    hint: 'تصفح الرحلات بحرية — انضم للحجز أو المراسلة',
    highlightedLabel: 'مقترحة الآن',
    viewRide: 'شاهد الرحلة',
    joinNow: 'انضم الآن',
    continueBrowsing: 'متابعة التصفح',
    loadMore: 'عرض المزيد',
    previewMode: 'وضع المعاينة',
    lockedBooking: 'انضم لحجز هذا المقعد',
    lockedMessage: 'انضم لمراسلة السائق',
    routeMapLabel: 'معاينة نشاط المسارات',
    routeCount: '{count} مسارات',
    ridesNearby: 'رحلات يمكنك فهمها بسرعة',
    seatsLeft: '{count} مقاعد متبقية',
    onlySeatLeft: 'مقعد واحد فقط متبق',
    loadingTitle: 'يتم تحميل الرحلات',
    emptyTitle: 'لا توجد رحلات على هذا المسار بعد',
    emptyBody: 'جرب مساراً آخر أو أنشئ رحلة.',
    errorTitle: 'لم يتم تحميل الرحلات',
    errorBody: 'لم نتمكن من تحميل الرحلات الآن. حاول مرة أخرى بعد قليل.',
  },
  he: {
    navCta: 'להצטרף עכשיו',
    heroEyebrow: 'תצוגה חיה',
    heroTitle: 'הנה נסיעות שקורות סביבך עכשיו',
    heroBody: 'אפשר לעיין קודם. מצטרפים רק כשרוצים להזמין, לשלוח הודעה או לשמור מסלול.',
    hint: 'אפשר לעיין בנסיעות בחופשיות — מצטרפים כדי להזמין או לשלוח הודעה',
    highlightedLabel: 'מומלץ עכשיו',
    viewRide: 'צפייה בנסיעה',
    joinNow: 'להצטרף עכשיו',
    continueBrowsing: 'להמשיך לעיין',
    loadMore: 'לטעון עוד',
    previewMode: 'מצב תצוגה',
    lockedBooking: 'הצטרפו כדי להזמין מקום',
    lockedMessage: 'הצטרפו כדי לשלוח הודעה לנהג',
    routeMapLabel: 'תצוגת פעילות במסלול',
    routeCount: '{count} מסלולים',
    ridesNearby: 'נסיעות שאפשר לסרוק עכשיו',
    seatsLeft: '{count} מקומות נשארו',
    onlySeatLeft: 'נשאר מקום אחד בלבד',
    loadingTitle: 'טוענים נסיעות',
    emptyTitle: 'עדיין אין נסיעות במסלול הזה',
    emptyBody: 'נסו מסלול אחר או צרו אחד.',
    errorTitle: 'הנסיעות לא נטענו',
    errorBody: 'לא הצלחנו לטעון נסיעות כרגע. נסו שוב בעוד רגע.',
  },
};

export const PREVIEW_RIDES: PreviewRide[] = [
  {
    id: 'preview-tau-haifa',
    origin: 'Tel Aviv University',
    destination: 'Haifa',
    timeLabel: '14:30',
    dayLabel: 'Today',
    seatsAvailable: 1,
    priceLabel: '₪28',
    driverName: 'Maya',
    communityName: 'University rides',
    passengerInitials: ['N', 'Y', 'L'],
    activityHint: 'Leaving in 20 min',
    urgency: 'Leaving soon',
    trustLine: 'Driver completed 18 community rides',
    detailNote: 'Pickup near the main gate. Drop-off close to Hof HaCarmel.',
  },
  {
    id: 'preview-beer-jerusalem',
    origin: "Be'er Sheva",
    destination: 'Jerusalem',
    timeLabel: '16:10',
    dayLabel: 'Today',
    seatsAvailable: 2,
    priceLabel: '₪32',
    driverName: 'Yousef',
    communityName: 'Student commute',
    passengerInitials: ['A', 'R'],
    activityHint: '3 people viewed this',
    urgency: '2 seats left',
    trustLine: 'Usually replies in a few minutes',
    detailNote: 'Comfortable route for students heading back after classes.',
  },
  {
    id: 'preview-technion-carmel',
    origin: 'Technion',
    destination: 'Carmel Center',
    timeLabel: '08:15',
    dayLabel: 'Tomorrow',
    seatsAvailable: 3,
    priceLabel: '₪12',
    driverName: 'Noa',
    communityName: 'Technion morning rides',
    passengerInitials: ['D', 'S', 'M'],
    activityHint: 'Recently added',
    trustLine: 'Verified student community',
    detailNote: 'Short morning ride with a regular campus driver.',
  },
  {
    id: 'preview-jaffa-rehovot',
    origin: 'Jaffa',
    destination: 'Rehovot',
    timeLabel: '18:40',
    dayLabel: 'Today',
    seatsAvailable: 4,
    priceLabel: '₪24',
    driverName: 'Anas',
    communityName: 'Evening campus rides',
    passengerInitials: ['H', 'B'],
    activityHint: 'Recently added',
    trustLine: 'Route shared inside a verified group',
    detailNote: 'Good option after evening labs or late shifts.',
  },
  {
    id: 'preview-herzliya-tau',
    origin: 'Herzliya',
    destination: 'Tel Aviv University',
    timeLabel: '09:20',
    dayLabel: 'Tomorrow',
    seatsAvailable: 1,
    priceLabel: '₪18',
    driverName: 'Lior',
    communityName: 'Morning class rides',
    passengerInitials: ['O'],
    activityHint: 'Only 1 seat left',
    urgency: 'Only 1 seat left',
    trustLine: 'Shared by a verified student driver',
    detailNote: 'Arrives before first lecture block.',
  },
  {
    id: 'preview-haifa-technion',
    origin: 'Haifa Center',
    destination: 'Technion',
    timeLabel: '12:05',
    dayLabel: 'Tomorrow',
    seatsAvailable: 3,
    priceLabel: '₪10',
    driverName: 'Roni',
    communityName: 'Technion shuttle group',
    passengerInitials: ['T', 'K'],
    activityHint: '4 people viewed this',
    trustLine: 'Driver profile verified',
    detailNote: 'A quick midday campus connection.',
  },
];

type PreviewRideLocalization = Partial<
  Pick<PreviewRide, 'dayLabel' | 'communityName' | 'activityHint' | 'urgency' | 'trustLine' | 'detailNote'>
>;

const PREVIEW_RIDE_LOCALIZATION: Record<Lang, Record<string, PreviewRideLocalization>> = {
  en: {},
  ar: {
    'preview-tau-haifa': {
      dayLabel: 'اليوم',
      communityName: 'رحلات جامعية',
      activityHint: 'يغادر خلال 20 دقيقة',
      urgency: 'يغادر قريباً',
      trustLine: 'السائقة أكملت 18 رحلة داخل المجتمع',
      detailNote: 'نقطة الانطلاق قرب البوابة الرئيسية. الوصول قريب من Hof HaCarmel.',
    },
    'preview-beer-jerusalem': {
      dayLabel: 'اليوم',
      communityName: 'تنقل الطلاب',
      activityHint: 'شاهده 3 طلاب',
      urgency: 'مقعدان متبقيان',
      trustLine: 'يرد عادة خلال دقائق',
      detailNote: 'مسار مريح للطلاب العائدين بعد المحاضرات.',
    },
    'preview-technion-carmel': {
      dayLabel: 'غداً',
      communityName: 'رحلات Technion الصباحية',
      activityHint: 'أضيفت مؤخراً',
      trustLine: 'مجتمع طلابي موثق',
      detailNote: 'رحلة صباحية قصيرة مع سائق جامعي معتاد.',
    },
    'preview-jaffa-rehovot': {
      dayLabel: 'اليوم',
      communityName: 'رحلات جامعية مسائية',
      activityHint: 'أضيفت مؤخراً',
      trustLine: 'المسار منشور داخل مجموعة موثقة',
      detailNote: 'خيار مناسب بعد المختبرات المسائية أو الورديات المتأخرة.',
    },
    'preview-herzliya-tau': {
      dayLabel: 'غداً',
      communityName: 'رحلات المحاضرات الصباحية',
      activityHint: 'مقعد واحد فقط',
      urgency: 'مقعد واحد فقط',
      trustLine: 'منشورة بواسطة سائق طالب موثق',
      detailNote: 'تصل قبل بداية كتلة المحاضرات الأولى.',
    },
    'preview-haifa-technion': {
      dayLabel: 'غداً',
      communityName: 'مجموعة Technion للتنقل',
      activityHint: 'شاهده 4 طلاب',
      trustLine: 'ملف السائق موثق',
      detailNote: 'وصلة جامعية سريعة في منتصف اليوم.',
    },
  },
  he: {
    'preview-tau-haifa': {
      dayLabel: 'היום',
      communityName: 'נסיעות אוניברסיטה',
      activityHint: 'יוצאת בעוד 20 דקות',
      urgency: 'יוצאת בקרוב',
      trustLine: 'הנהגת השלימה 18 נסיעות בקהילה',
      detailNote: 'איסוף ליד השער הראשי. הורדה קרובה ל-Hof HaCarmel.',
    },
    'preview-beer-jerusalem': {
      dayLabel: 'היום',
      communityName: 'נסיעות סטודנטים',
      activityHint: '3 סטודנטים צפו בזה',
      urgency: 'נותרו 2 מקומות',
      trustLine: 'בדרך כלל עונה תוך כמה דקות',
      detailNote: 'מסלול נוח לסטודנטים שחוזרים אחרי שיעורים.',
    },
    'preview-technion-carmel': {
      dayLabel: 'מחר',
      communityName: 'נסיעות בוקר בטכניון',
      activityHint: 'נוספה לאחרונה',
      trustLine: 'קהילת סטודנטים מאומתת',
      detailNote: 'נסיעת בוקר קצרה עם נהגת קמפוס קבועה.',
    },
    'preview-jaffa-rehovot': {
      dayLabel: 'היום',
      communityName: 'נסיעות ערב לקמפוס',
      activityHint: 'נוספה לאחרונה',
      trustLine: 'המסלול שותף בקבוצה מאומתת',
      detailNote: 'אפשרות טובה אחרי מעבדות ערב או משמרות מאוחרות.',
    },
    'preview-herzliya-tau': {
      dayLabel: 'מחר',
      communityName: 'נסיעות לשיעור בוקר',
      activityHint: 'נותר מקום אחד בלבד',
      urgency: 'נותר מקום אחד בלבד',
      trustLine: 'שותפה על ידי נהג סטודנט מאומת',
      detailNote: 'מגיעה לפני מקבץ ההרצאות הראשון.',
    },
    'preview-haifa-technion': {
      dayLabel: 'מחר',
      communityName: 'קבוצת נסיעות לטכניון',
      activityHint: '4 סטודנטים צפו בזה',
      trustLine: 'פרופיל הנהג מאומת',
      detailNote: 'חיבור מהיר לקמפוס באמצע היום.',
    },
  },
};

export function getPreviewRides(lang: Lang): PreviewRide[] {
  const localizedRides = PREVIEW_RIDE_LOCALIZATION[lang] ?? PREVIEW_RIDE_LOCALIZATION.en;
  return PREVIEW_RIDES.map((ride) => ({
    ...ride,
    ...(localizedRides[ride.id] ?? {}),
  }));
}
