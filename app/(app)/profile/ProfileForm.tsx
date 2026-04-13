'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import { updateProfile } from './actions';

type Props = {
  userId: string;
  initialDisplayName: string;
  initialPhone: string;
  initialCityOrArea: string;
  initialAge: number | null;
  initialGender: string;
  initialIsDriver: boolean | null;
  initialGenderPreference?: string | null;
  mode?: 'profile' | 'onboarding';
  redirectOnSuccess?: string;
};


const COPY = {
  en: {
    phone: 'Phone',
    city: 'City or area',
    age: 'Age',
    gender: 'Gender',
    genderSelect: 'Select gender',
    editInfo: 'Edit profile',
    genderOptions: {
      woman: 'Woman',
      man: 'Man',
      nonBinary: 'Non-binary',
      preferNotToSay: 'Prefer not to say',
    },
    driverQuestion: 'Are you a driver?',
    driverYesTitle: 'Yes',
    driverYesDesc: 'I can offer rides as a driver.',
    driverNoTitle: 'No',
    driverNoDesc: 'I am only looking for rides right now.',
    genderPreference: 'Gender preference',
    genderPreferenceHint: 'Optional. Leave it blank if you have no preference.',
    genderPreferenceOptions: {
      none: 'No preference',
      women: 'Prefer women',
      men: 'Prefer men',
      nonBinary: 'Prefer non-binary riders',
      sameAsMe: 'Prefer the same gender as me',
    },
    onboardingSaved: 'Profile saved. Redirecting...',
    finishSetup: 'Finish setup',
    required: 'Required',
  },
  ar: {
    phone: 'رقم الهاتف',
    city: 'المدينة أو المنطقة',
    age: 'العمر',
    gender: 'الجنس',
    genderSelect: 'اختر الجنس',
    editInfo: 'تعديل المعلومات',
    genderOptions: {
      woman: 'امرأة',
      man: 'رجل',
      nonBinary: 'غير ثنائي',
      preferNotToSay: 'أفضل عدم الإجابة',
    },
    driverQuestion: 'هل ترغب بعرض رحلات كسائق؟',
    driverYesTitle: 'نعم',
    driverYesDesc: 'يمكنني عرض رحلات كسائق.',
    driverNoTitle: 'لا',
    driverNoDesc: 'أنا أبحث عن رحلات فقط في الوقت الحالي.',
    genderPreference: 'تفضيل الجلوس (اختياري)',
    genderPreferenceHint: 'اتركه فارغًا إذا لم يكن لديك تفضيل.',
    genderPreferenceOptions: {
      none: 'لا يوجد تفضيل',
      women: 'أفضل النساء',
      men: 'أفضل الرجال',
      nonBinary: 'أفضل الركاب غير الثنائيين',
      sameAsMe: 'أفضل نفس جنسي',
    },
    onboardingSaved: 'تم حفظ الملف الشخصي. جارٍ التحويل...',
    finishSetup: 'إنهاء الإعداد',
    required: 'مطلوب',
  },
  he: {
    phone: 'טלפון',
    city: 'עיר או אזור',
    age: 'גיל',
    gender: 'מגדר',
    genderSelect: 'בחרו מגדר',
    editInfo: 'ערוך פרטים',
    genderOptions: {
      woman: 'אישה',
      man: 'גבר',
      nonBinary: 'לא בינארי',
      preferNotToSay: 'מעדיף לא לציין',
    },
    driverQuestion: 'האם אתם נהגים?',
    driverYesTitle: 'כן',
    driverYesDesc: 'אני יכול להציע נסיעות כנהג.',
    driverNoTitle: 'לא',
    driverNoDesc: 'כרגע אני רק מחפש נסיעות.',
    genderPreference: 'העדפת מגדר',
    genderPreferenceHint: 'אופציונלי. השאירו ריק אם אין לכם העדפה.',
    genderPreferenceOptions: {
      none: 'ללא העדפה',
      women: 'מעדיף נשים',
      men: 'מעדיף גברים',
      nonBinary: 'מעדיף נוסעים לא בינאריים',
      sameAsMe: 'מעדיף אותו מגדר כמוני',
    },
    onboardingSaved: 'הפרופיל נשמר. מעבירים אתכם...',
    finishSetup: 'סיום ההגדרה',
    required: 'חובה',
  },
} as const;

function localizeProfileError(message: string, lang: keyof typeof COPY) {
  const map = {
    en: {
      'Display name is required.': 'Display name is required.',
      'Phone is required.': 'Phone is required.',
      'City or area is required.': 'City or area is required.',
      'Age is required.': 'Age is required.',
      'Please choose a valid gender.': 'Please choose a valid gender.',
      'Please choose whether you are a driver.': 'Please choose whether you are a driver.',
      'Please choose a valid gender preference.': 'Please choose a valid gender preference.',
    },
    ar: {
      'Display name is required.': 'الاسم المعروض مطلوب.',
      'Phone is required.': 'رقم الهاتف مطلوب.',
      'City or area is required.': 'المدينة أو المنطقة مطلوبة.',
      'Age is required.': 'العمر مطلوب.',
      'Please choose a valid gender.': 'اختر الجنس من الخيارات المتاحة.',
      'Please choose whether you are a driver.': 'حدد ما إذا كنت ترغب بعرض رحلات كسائق.',
      'Please choose a valid gender preference.': 'اختر تفضيلًا صحيحًا من القائمة.',
    },
    he: {
      'Display name is required.': 'שם התצוגה הוא שדה חובה.',
      'Phone is required.': 'מספר טלפון הוא שדה חובה.',
      'City or area is required.': 'עיר או אזור הם שדה חובה.',
      'Age is required.': 'גיל הוא שדה חובה.',
      'Please choose a valid gender.': 'בחרו מגדר תקין.',
      'Please choose whether you are a driver.': 'בחרו אם אתם נהגים.',
      'Please choose a valid gender preference.': 'בחרו העדפת מגדר תקינה.',
    },
  } as const;

  return map[lang][message as keyof (typeof map)[typeof lang]] ?? message;
}

export default function ProfileForm({
  userId,
  initialDisplayName,
  initialPhone,
  initialCityOrArea,
  initialAge,
  initialGender,
  initialIsDriver,
  initialGenderPreference = '',
  mode = 'profile',
  redirectOnSuccess,
}: Props) {
  const { t, lang } = useTranslation();
  const copy = COPY[lang];
  const isOnboarding = mode === 'onboarding';
  const showExtendedPersonalDetails = mode === 'profile';
  const [isEditing, setIsEditing] = useState(mode === 'onboarding');
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [phone, setPhone] = useState(initialPhone);
  const [cityOrArea, setCityOrArea] = useState(initialCityOrArea);
  const [age, setAge] = useState(initialAge ? String(initialAge) : '');
  const [gender, setGender] = useState(initialGender);
  const [isDriver, setIsDriver] = useState<boolean | null>(initialIsDriver);
  const [genderPreference, setGenderPreference] = useState(initialGenderPreference ?? '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      await updateProfile(userId, {
        displayName,
        phone,
        cityOrArea,
        age: age.trim().length > 0 ? Number(age) : null,
        gender,
        isDriver,
        ...(showExtendedPersonalDetails
          ? {
              genderPreference,
            }
          : {}),
      });

      if (redirectOnSuccess) {
        window.location.href = redirectOnSuccess;
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? localizeProfileError(err.message, lang) : t('failed_to_save'));
    } finally {
      setLoading(false);
    }
  };

  if (!isEditing && mode !== 'onboarding') {
    const genderLabel = (() => {
      if (!gender) return '—';
      if (gender === 'woman') return copy.genderOptions.woman;
      if (gender === 'man') return copy.genderOptions.man;
      if (gender === 'non-binary') return copy.genderOptions.nonBinary;
      if (gender === 'prefer_not_to_say') return copy.genderOptions.preferNotToSay;
      return gender;
    })();
    const driverLabel = isDriver === true ? copy.driverYesTitle : isDriver === false ? copy.driverNoTitle : '—';

    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('display_name')}</p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{displayName || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{copy.phone}</p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{phone || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{copy.city}</p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{cityOrArea || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{copy.age}</p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{age || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{copy.gender}</p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{genderLabel}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{copy.driverQuestion}</p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{driverLabel}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="w-full rounded-xl bg-sky-600 dark:bg-sky-500 px-4 py-3 font-medium text-white hover:bg-sky-700 dark:hover:bg-sky-600 transition-colors"
        >
          {copy.editInfo}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {t('display_name')}
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => { setDisplayName(e.target.value); setSuccess(false); }}
          required
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {copy.phone}
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => { setPhone(e.target.value); setSuccess(false); }}
          required
          autoComplete="tel"
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {copy.city}
        </label>
        <input
          type="text"
          value={cityOrArea}
          onChange={(e) => { setCityOrArea(e.target.value); setSuccess(false); }}
          required
          autoComplete="address-level2"
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {copy.age}
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={age}
            onChange={(e) => { setAge(e.target.value); setSuccess(false); }}
            required
            inputMode="numeric"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {copy.gender}
          </label>
          <select
            value={gender}
            onChange={(e) => { setGender(e.target.value); setSuccess(false); }}
            required
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
          >
            <option value="">{copy.genderSelect}</option>
            <option value="woman">{copy.genderOptions.woman}</option>
            <option value="man">{copy.genderOptions.man}</option>
            <option value="non-binary">{copy.genderOptions.nonBinary}</option>
            <option value="prefer_not_to_say">{copy.genderOptions.preferNotToSay}</option>
          </select>
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {copy.driverQuestion}
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
            isDriver === true
              ? 'border-sky-500 bg-sky-50 dark:border-sky-400 dark:bg-sky-900/20'
              : 'border-slate-300 dark:border-slate-700'
          }`}>
            <input
              type="radio"
              name="is_driver"
              checked={isDriver === true}
              onChange={() => { setIsDriver(true); setSuccess(false); }}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-slate-900 dark:text-white">{copy.driverYesTitle}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                {copy.driverYesDesc}
              </span>
            </span>
          </label>

          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
            isDriver === false
              ? 'border-sky-500 bg-sky-50 dark:border-sky-400 dark:bg-sky-900/20'
              : 'border-slate-300 dark:border-slate-700'
          }`}>
            <input
              type="radio"
              name="is_driver"
              checked={isDriver === false}
              onChange={() => { setIsDriver(false); setSuccess(false); }}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-slate-900 dark:text-white">{copy.driverNoTitle}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                {copy.driverNoDesc}
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      {showExtendedPersonalDetails && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {copy.genderPreference}
          </label>
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
            {copy.genderPreferenceHint}
          </p>
          <select
            value={genderPreference}
            onChange={(e) => { setGenderPreference(e.target.value); setSuccess(false); }}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
          >
            <option value="">{copy.genderPreferenceOptions.none}</option>
            <option value="women">{copy.genderPreferenceOptions.women}</option>
            <option value="men">{copy.genderPreferenceOptions.men}</option>
            <option value="non-binary">{copy.genderPreferenceOptions.nonBinary}</option>
            <option value="same_as_me">{copy.genderPreferenceOptions.sameAsMe}</option>
          </select>
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-900/50 p-3">
          <p className="text-sm text-green-700 dark:text-green-400 font-medium">
            {isOnboarding ? copy.onboardingSaved : t('profile_updated')}
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 p-3">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-sky-600 dark:bg-sky-500 px-4 py-3 font-medium text-white hover:bg-sky-700 dark:hover:bg-sky-600 disabled:opacity-50 transition-colors btn-press"
      >
        {loading ? t('saving') : isOnboarding ? copy.finishSetup : t('save')}
      </button>
    </form>
  );
}
