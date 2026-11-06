export type AppLanguage = 'en' | 'ar';
type LocaleLanguage = { languageCode: string | null };

// Locale order is the user's preference order. Unsupported languages fall back
// to the next supported language, then English if no supported locale exists.
export function selectLanguage(locales: readonly LocaleLanguage[]): AppLanguage {
  for (const locale of locales) {
    const code = locale.languageCode?.toLowerCase();
    if (code === 'ar' || code === 'en') return code;
  }
  return 'en';
}
