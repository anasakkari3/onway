import type { Lang } from '@/lib/i18n/dictionaries';

/**
 * Curated university / college catalogue, grouped by geographic region and used
 * by the institution selector.
 *
 * IMPORTANT: institutions are NOT a separate data store. Every institution maps
 * 1:1 onto an existing ride *community* via `communityId` (see
 * `config/allowed-communities.json`). Selecting an institution joins / requests
 * the matching community through the existing backend, so trips, membership and
 * admin filtering keep working on `community_id` exactly as before. This file
 * only adds curated presentation metadata (region + canonical Arabic/English
 * names + search keywords) on top of communities — it does not duplicate them.
 */

export type InstitutionRegion =
  | 'jerusalem'
  | 'west-bank'
  | 'north-haifa'
  | 'center'
  | 'south';

export type Institution = {
  /** Stable id — identical to the matching community id. */
  id: string;
  /** Community to join when this institution is selected. */
  communityId: string;
  arabicName: string;
  englishName: string;
  region: InstitutionRegion;
  /** Lower-cased tokens (Arabic + English) used for fuzzy search. */
  searchKeywords: string[];
};

/** Sentinel id for the "Other institution" option. */
export const OTHER_INSTITUTION_ID = 'other';

/** Display order of regions in the selector. */
export const REGION_ORDER: InstitutionRegion[] = [
  'jerusalem',
  'west-bank',
  'north-haifa',
  'center',
  'south',
];

export const REGION_LABELS: Record<InstitutionRegion, Record<Lang, string>> = {
  jerusalem: { ar: 'منطقة القدس', en: 'Jerusalem Area', he: 'אזור ירושלים' },
  'west-bank': { ar: 'الضفة الغربية', en: 'West Bank', he: 'הגדה המערבית' },
  'north-haifa': { ar: 'الشمال / منطقة حيفا', en: 'North / Haifa Area', he: 'צפון / אזור חיפה' },
  center: { ar: 'منطقة المركز', en: 'Center Area', he: 'אזור המרכז' },
  south: { ar: 'منطقة الجنوب', en: 'South Area', he: 'אזור הדרום' },
};

export function getRegionLabel(region: InstitutionRegion, lang: Lang): string {
  return REGION_LABELS[region][lang] ?? REGION_LABELS[region].en;
}

export const INSTITUTIONS: Institution[] = [
  // ---- Jerusalem Area ------------------------------------------------------
  {
    id: 'hebrew-university-mount-scopus',
    communityId: 'hebrew-university-mount-scopus',
    arabicName: 'الجامعة العبرية في القدس',
    englishName: 'Hebrew University of Jerusalem',
    region: 'jerusalem',
    searchKeywords: ['hebrew', 'university', 'jerusalem', 'scopus', 'givat ram', 'العبرية', 'الجامعة', 'القدس'],
  },
  {
    id: 'azrieli-college-engineering',
    communityId: 'azrieli-college-engineering',
    arabicName: 'كلية عزريئيلي للهندسة القدس',
    englishName: 'Azrieli College of Engineering Jerusalem',
    region: 'jerusalem',
    searchKeywords: ['azrieli', 'engineering', 'jerusalem', 'عزريئيلي', 'هندسة', 'القدس'],
  },
  {
    id: 'bezalel-academy',
    communityId: 'bezalel-academy',
    arabicName: 'بتسلئيل أكاديمية الفنون والتصميم',
    englishName: 'Bezalel Academy of Arts and Design',
    region: 'jerusalem',
    searchKeywords: ['bezalel', 'arts', 'design', 'بتسلئيل', 'الفنون', 'التصميم'],
  },
  {
    id: 'hadassah-college',
    communityId: 'hadassah-college',
    arabicName: 'كلية هداسا الأكاديمية',
    englishName: 'Hadassah Academic College',
    region: 'jerusalem',
    searchKeywords: ['hadassah', 'academic', 'college', 'هداسا', 'كلية'],
  },
  {
    id: 'jerusalem-college-technology',
    communityId: 'jerusalem-college-technology',
    arabicName: 'كلية القدس للتكنولوجيا / مخون ليف',
    englishName: 'Jerusalem College of Technology / Machon Lev',
    region: 'jerusalem',
    searchKeywords: ['jct', 'machon lev', 'technology', 'jerusalem', 'القدس', 'التكنولوجيا', 'مخون ليف'],
  },
  {
    id: 'al-quds-university',
    communityId: 'al-quds-university',
    arabicName: 'جامعة القدس',
    englishName: 'Al-Quds University',
    region: 'jerusalem',
    searchKeywords: ['al-quds', 'alquds', 'university', 'القدس', 'جامعة'],
  },

  // ---- West Bank -----------------------------------------------------------
  {
    id: 'birzeit-university',
    communityId: 'birzeit-university',
    arabicName: 'جامعة بيرزيت',
    englishName: 'Birzeit University',
    region: 'west-bank',
    searchKeywords: ['birzeit', 'university', 'بيرزيت', 'جامعة'],
  },
  {
    id: 'an-najah-national-university',
    communityId: 'an-najah-national-university',
    arabicName: 'جامعة النجاح الوطنية',
    englishName: 'An-Najah National University',
    region: 'west-bank',
    searchKeywords: ['an-najah', 'najah', 'nablus', 'النجاح', 'الوطنية', 'جامعة'],
  },
  {
    id: 'arab-american-university',
    communityId: 'arab-american-university',
    arabicName: 'الجامعة العربية الأمريكية',
    englishName: 'Arab American University',
    region: 'west-bank',
    searchKeywords: ['arab', 'american', 'aaup', 'jenin', 'العربية', 'الأمريكية', 'جامعة'],
  },
  {
    id: 'palestine-technical-university-kadoorie',
    communityId: 'palestine-technical-university-kadoorie',
    arabicName: 'جامعة فلسطين التقنية خضوري',
    englishName: 'Palestine Technical University Kadoorie',
    region: 'west-bank',
    searchKeywords: ['kadoorie', 'ptuk', 'technical', 'tulkarm', 'خضوري', 'التقنية', 'فلسطين'],
  },
  {
    id: 'palestine-polytechnic-university',
    communityId: 'palestine-polytechnic-university',
    arabicName: 'جامعة بوليتكنك فلسطين',
    englishName: 'Palestine Polytechnic University',
    region: 'west-bank',
    searchKeywords: ['polytechnic', 'ppu', 'hebron', 'بوليتكنك', 'فلسطين', 'جامعة'],
  },
  {
    id: 'hebron-university',
    communityId: 'hebron-university',
    arabicName: 'جامعة الخليل',
    englishName: 'Hebron University',
    region: 'west-bank',
    searchKeywords: ['hebron', 'university', 'الخليل', 'جامعة'],
  },
  {
    id: 'bethlehem-university',
    communityId: 'bethlehem-university',
    arabicName: 'جامعة بيت لحم',
    englishName: 'Bethlehem University',
    region: 'west-bank',
    searchKeywords: ['bethlehem', 'university', 'بيت لحم', 'جامعة'],
  },
  {
    id: 'al-quds-open-university',
    communityId: 'al-quds-open-university',
    arabicName: 'جامعة القدس المفتوحة',
    englishName: 'Al-Quds Open University',
    region: 'west-bank',
    searchKeywords: ['al-quds', 'open', 'qou', 'القدس', 'المفتوحة', 'جامعة'],
  },

  // ---- North / Haifa Area --------------------------------------------------
  {
    id: 'university-of-haifa',
    communityId: 'university-of-haifa',
    arabicName: 'جامعة حيفا',
    englishName: 'University of Haifa',
    region: 'north-haifa',
    searchKeywords: ['haifa', 'university', 'حيفا', 'جامعة'],
  },
  {
    id: 'technion',
    communityId: 'technion',
    arabicName: 'التخنيون',
    englishName: 'Technion – Israel Institute of Technology',
    region: 'north-haifa',
    searchKeywords: ['technion', 'haifa', 'institute', 'technology', 'التخنيون'],
  },
  {
    id: 'al-qasemi-college',
    communityId: 'al-qasemi-college',
    arabicName: 'كلية القاسمي الأكاديمية',
    englishName: 'Al-Qasemi Academic College of Education',
    region: 'north-haifa',
    searchKeywords: ['qasemi', 'al-qasemi', 'baqa', 'education', 'القاسمي', 'كلية'],
  },

  // ---- Center Area ---------------------------------------------------------
  {
    id: 'tel-aviv-university',
    communityId: 'tel-aviv-university',
    arabicName: 'جامعة تل أبيب',
    englishName: 'Tel Aviv University',
    region: 'center',
    searchKeywords: ['tel aviv', 'tau', 'university', 'تل أبيب', 'جامعة'],
  },
  {
    id: 'bar-ilan-university',
    communityId: 'bar-ilan-university',
    arabicName: 'جامعة بار إيلان',
    englishName: 'Bar-Ilan University',
    region: 'center',
    searchKeywords: ['bar-ilan', 'bar ilan', 'university', 'بار إيلان', 'جامعة'],
  },
  {
    id: 'academic-college-tel-aviv-yaffo',
    communityId: 'academic-college-tel-aviv-yaffo',
    arabicName: 'الكلية الأكاديمية تل أبيب يافا',
    englishName: 'The Academic College of Tel Aviv–Yaffo',
    region: 'center',
    searchKeywords: ['academic', 'college', 'tel aviv', 'yaffo', 'jaffa', 'تل أبيب', 'يافا', 'الكلية'],
  },
  {
    id: 'afeka-college',
    communityId: 'afeka-college',
    arabicName: 'أفكا — كلية تل أبيب الأكاديمية للهندسة',
    englishName: 'Afeka Tel Aviv Academic College of Engineering',
    region: 'center',
    searchKeywords: ['afeka', 'engineering', 'tel aviv', 'أفكا', 'الهندسة', 'كلية'],
  },
  {
    id: 'holon-institute-technology',
    communityId: 'holon-institute-technology',
    arabicName: 'معهد حولون للتكنولوجيا',
    englishName: 'Holon Institute of Technology',
    region: 'center',
    searchKeywords: ['holon', 'hit', 'institute', 'technology', 'حولون', 'معهد', 'التكنولوجيا'],
  },
  {
    id: 'shenkar-college',
    communityId: 'shenkar-college',
    arabicName: 'شنكار للهندسة والتصميم والفن',
    englishName: 'Shenkar Engineering, Design and Art',
    region: 'center',
    searchKeywords: ['shenkar', 'engineering', 'design', 'art', 'شنكار', 'الهندسة', 'التصميم'],
  },
  {
    id: 'ariel-university',
    communityId: 'ariel-university',
    arabicName: 'جامعة أريئيل',
    englishName: 'Ariel University',
    region: 'center',
    searchKeywords: ['ariel', 'university', 'أريئيل', 'جامعة'],
  },

  // ---- South Area ----------------------------------------------------------
  {
    id: 'ben-gurion-university',
    communityId: 'ben-gurion-university',
    arabicName: 'جامعة بن غوريون في النقب',
    englishName: 'Ben-Gurion University of the Negev',
    region: 'south',
    searchKeywords: ['ben-gurion', 'ben gurion', 'bgu', 'negev', 'beer sheva', 'بن غوريون', 'النقب', 'جامعة'],
  },
];

/** Fast lookup helpers. */
export const INSTITUTION_BY_ID = new Map(INSTITUTIONS.map((inst) => [inst.id, inst]));
export const INSTITUTION_COMMUNITY_IDS = new Set(INSTITUTIONS.map((inst) => inst.communityId));

export function getInstitutionById(id: string | null | undefined): Institution | null {
  if (!id) return null;
  return INSTITUTION_BY_ID.get(id) ?? null;
}

export function getInstitutionByCommunityId(communityId: string | null | undefined): Institution | null {
  if (!communityId) return null;
  return INSTITUTIONS.find((inst) => inst.communityId === communityId) ?? null;
}

/** Group institutions by region in display order (empty regions are dropped). */
export function getInstitutionsByRegion(
  list: Institution[] = INSTITUTIONS
): { region: InstitutionRegion; institutions: Institution[] }[] {
  return REGION_ORDER.map((region) => ({
    region,
    institutions: list.filter((inst) => inst.region === region),
  })).filter((group) => group.institutions.length > 0);
}

/**
 * Normalise text for tolerant matching across Arabic orthographic variants
 * (hamza/alef forms, taa marbuta, alef maqsura, diacritics, tatweel) and case.
 */
export function normalizeInstitutionText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[ً-ٰٟ]/g, '') // Arabic harakat / superscript alef
    .replace(/ـ/g, '') // tatweel
    .replace(/[إأآٱا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ئ/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Search by Arabic name, English name, region label, or keywords. */
export function searchInstitutions(query: string, lang: Lang = 'ar'): Institution[] {
  const q = normalizeInstitutionText(query);
  if (!q) return INSTITUTIONS;

  return INSTITUTIONS.filter((inst) => {
    const haystack = [
      inst.arabicName,
      inst.englishName,
      getRegionLabel(inst.region, lang),
      getRegionLabel(inst.region, 'en'),
      ...inst.searchKeywords,
    ]
      .map(normalizeInstitutionText)
      .join(' | ');
    return haystack.includes(q);
  });
}
