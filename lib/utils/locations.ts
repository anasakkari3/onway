/**
 * Normalizes location names to handle variations across languages (English, Arabic, Hebrew)
 * This allows users to search naturally in any supported language and find the same canonical locations.
 */
export function normalizeLocationName(input?: string | null): string {
    if (!input) return '';
    const cleanInput = input.trim().toLowerCase();

    const rules: Record<string, string[]> = {
        'jerusalem': ['jerusalem', 'al-quds', 'al quds', 'القدس', 'ירושלים', 'jeruzalem'],
        'ramallah': ['ramallah', 'رام الله', 'رامالله', 'רמאללה'],
        'tel aviv': ['tel aviv', 'tlv', 'تل أبيب', 'תל אביב', 'tel-aviv', 'tel aviv-yafo'],
        'haifa': ['haifa', 'حيفا', 'חיפה'],
        'nazareth': ['nazareth', 'الناصرة', 'נצרת'],
        'nablus': ['nablus', 'نابلس', 'שכם', 'shekhem'],
        'hebron': ['hebron', 'al-khalil', 'الخليل', 'חברון'],
        'jenin': ['jenin', 'جنين', 'ג\'נין', 'גנין'],
        'bethlehem': ['bethlehem', 'بيت لحم', 'בית לחם'],
        'jericho': ['jericho', 'اريحا', 'أريحا', 'יריחו'],
        'beer sheva': ['beer sheva', 'beersheba', 'بئر السبع', 'באר שבע'],
        'safed': ['safed', 'tzfat', 'صفد', 'צפת']
    };

    for (const [canonical, aliases] of Object.entries(rules)) {
        if (aliases.includes(cleanInput)) {
            return canonical;
        }
    }

    return cleanInput;
}

/**
 * Defines major route networks for basic proximity matching.
 * Future enhancement: Replace this with real GPS/Maps distance calculations.
 */
const routeNetworks: string[][] = [
    ['jerusalem', 'ramallah', 'birzeit', 'nablus'],
    ['jerusalem', 'bethlehem', 'hebron'],
    ['tel aviv', 'jerusalem', 'haifa'],
    ['jenin', 'nablus', 'ramallah']
];

/**
 * Returns a list of canonical locations that are considered "nearby" or connected.
 */
export function getRelatedLocations(canonicalLocation: string): string[] {
    const related = new Set<string>();
    for (const network of routeNetworks) {
        if (network.includes(canonicalLocation)) {
            network.forEach(loc => {
                if (loc !== canonicalLocation) related.add(loc);
            });
        }
    }
    return Array.from(related);
}

/**
 * Calculates a base proximity score between an searched route and an actual route.
 * Returns a number between 0 and 100.
 */
export function calculateLocationMatchScore(
    tripOriginNorm: string, 
    tripDestNorm: string, 
    searchOriginNorm: string, 
    searchDestNorm: string
): number {
    if (!searchOriginNorm && !searchDestNorm) return 100; // No search filter
    
    let originScore = 0;
    let destScore = 0;

    // Origin scoring
    if (!searchOriginNorm || tripOriginNorm.includes(searchOriginNorm) || searchOriginNorm.includes(tripOriginNorm)) {
        originScore = 100;
    } else {
        const related = getRelatedLocations(searchOriginNorm);
        if (related.includes(tripOriginNorm)) originScore = 80;
    }

    // Destination scoring
    if (!searchDestNorm || tripDestNorm.includes(searchDestNorm) || searchDestNorm.includes(tripDestNorm)) {
        destScore = 100;
    } else {
        const related = getRelatedLocations(searchDestNorm);
        if (related.includes(tripDestNorm)) destScore = 80;
    }

    // Blend the scores
    if (originScore === 100 && destScore === 100) return 100;  // Exact match
    if (originScore === 100 && destScore === 80) return 90;    // Exact origin, nearby dest
    if (originScore === 80 && destScore === 100) return 90;    // Nearby origin, exact dest
    if (originScore >= 80 && destScore >= 80) return 75;       // Both are nearby
    
    // Partial Matches (only one side matches, the other doesn't matter or matches weakly)
    if (originScore === 100 || destScore === 100) return 60;
    if (originScore === 80 || destScore === 80) return 40;     // Weak partial match

    return 0; // Unrelated
}
