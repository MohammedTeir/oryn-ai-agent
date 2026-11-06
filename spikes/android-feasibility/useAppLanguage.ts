import { useLocales } from 'expo-localization';
import { selectLanguage } from './language';

export function useAppLanguage() {
  return selectLanguage(useLocales());
}
