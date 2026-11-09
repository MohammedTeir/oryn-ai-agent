import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocales } from 'expo-localization';
import { selectLanguage, type AppLanguage } from '../language';
import { openLocalDatabase } from '../storage/database';
import { createLanguagePreferenceStore, type LanguagePreference } from '../storage/languagePreference';

const store = createLanguagePreferenceStore(openLocalDatabase);
type Status = 'loading' | 'ready' | 'saving' | 'error';
type LanguageContext = { language: AppLanguage; preference: LanguagePreference; status: Status; select: (value: LanguagePreference) => Promise<void> };
const Context = createContext<LanguageContext | null>(null);

export function AppLanguageProvider({ children }: { children: ReactNode }) {
  const locales = useLocales();
  const [preference, setPreference] = useState<LanguagePreference>('system');
  const [status, setStatus] = useState<Status>('loading');
  const mounted = useRef(false);
  const busy = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const timer = setTimeout(() => {
      void store.load().then(result => {
        if (!mounted.current) return;
        if (result.ok) { setPreference(result.value); setStatus('ready'); }
        else setStatus('error');
        busy.current = false;
      });
    }, 0);
    return () => { mounted.current = false; clearTimeout(timer); };
  }, []);
  const select = useCallback(async (value: LanguagePreference) => {
    if (busy.current) return;
    busy.current = true; setStatus('saving');
    const result = await store.save(value);
    if (mounted.current) {
      if (result.ok) { setPreference(value); setStatus('ready'); }
      else setStatus('error');
      busy.current = false;
    }
  }, []);
  return <Context.Provider value={{ language: preference === 'system' ? selectLanguage(locales) : preference, preference, status, select }}>{children}</Context.Provider>;
}
export function useStoredLanguage(): LanguageContext {
  const value = useContext(Context);
  if (!value) throw new Error('App language provider missing');
  return value;
}
