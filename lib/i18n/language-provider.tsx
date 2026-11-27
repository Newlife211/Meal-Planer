'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { dictionaries, interpolate, type Lang, type Dict } from './translations';

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Dict;
  tf: (template: string, vars: Record<string, string | number>) => string;
  locale: string;
  mounted: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'amp_lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Always start with 'en' so the server-rendered markup matches the first client render.
  const [lang, setLangState] = useState<Lang>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (stored === 'en' || stored === 'ru') {
        setLangState(stored);
      } else {
        // No stored preference: default to English, and switch to Russian only
        // for visitors coming from Russia (geo by IP). Not persisted, so the
        // choice re-evaluates on later visits until the user picks manually.
        fetch('/api/geo')
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d && d.country === 'RU') setLangState('ru');
          })
          .catch(() => {
            /* ignore — keep English default */
          });
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      try {
        document.documentElement.lang = lang;
      } catch {
        /* ignore */
      }
    }
  }, [lang, mounted]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = dictionaries[lang];
  const tf = useCallback(
    (template: string, vars: Record<string, string | number>) => interpolate(template, vars),
    []
  );
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US';

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tf, locale, mounted }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
