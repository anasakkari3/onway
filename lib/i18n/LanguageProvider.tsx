'use client';

import { createContext, useContext, ReactNode } from 'react';
import { dictionaries, Lang } from './dictionaries';

type TranslationKey = keyof typeof dictionaries['en'];

interface LanguageContextProps {
    lang: Lang;
    t: (key: TranslationKey | (string & {})) => string;
}

const LanguageContext = createContext<LanguageContextProps>({
    lang: 'en',
    t: (k) => k as string,
});

export function LanguageProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
    const t = (key: TranslationKey | (string & {})): string => {
        return (dictionaries[lang] as any)?.[key] || (dictionaries['en'] as any)?.[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ lang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useTranslation() {
    return useContext(LanguageContext);
}
