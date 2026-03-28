'use server';

import { cookies } from 'next/headers';
import type { Lang } from './dictionaries';

export async function setLanguageCookie(lang: Lang) {
    const cookieStore = await cookies();
    cookieStore.set('NEXT_LOCALE', lang, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: 'lax'
    });
}
