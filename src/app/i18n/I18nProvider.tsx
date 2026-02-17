import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { translations, resolve, type Locale, type TranslationMap } from './translations';
import { useSettingsStore } from '../store/settingsStore';

// ─── i18n Context ────────────────────────────────────────────

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  availableLocales: { code: Locale; label: string; flag: string }[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

const AVAILABLE_LOCALES: I18nContextValue['availableLocales'] = [
  { code: 'el', label: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSettings } = useSettingsStore();
  const locale = (settings.defaultLanguage === 'en' ? 'en' : 'el') as Locale;

  const setLocale = useCallback((l: Locale) => {
    updateSettings({ defaultLanguage: l });
  }, [updateSettings]);

  const map: TranslationMap = useMemo(() => translations[locale], [locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => resolve(key, map, params),
    [map]
  );

  const value = useMemo(() => ({
    locale,
    setLocale,
    t,
    availableLocales: AVAILABLE_LOCALES,
  }), [locale, setLocale, t]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook to access translations.
 *
 * Usage:
 * ```tsx
 * const { t, locale, setLocale } = useI18n();
 * <span>{t('fleet.title')}</span>
 * <span>{t('auth.sessionExpiryWarning', { minutes: 5 })}</span>
 * ```
 */
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>');
  return ctx;
}
