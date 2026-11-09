import { useReducer } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import tokens from '../../docs/design/tokens.json';
import FeasibilityApp from './App';
import NavigationPreview from './milestone1/App';
import ShellPreview from './production/App';
import { previewDestination } from './previewNavigation';
import { useAppLanguage } from './useAppLanguage';
import { AppLanguageProvider } from './milestone1/AppLanguage';

const labels = {
  en: { open: 'Open Milestone 1 navigation preview', openShell: 'Open local app shell preview', close: 'Return to feasibility tests', notice: 'Navigation preview: features are not yet available.', shellNotice: 'Test-only shell preview. AI and execution are not available in this screen.' },
  ar: { open: 'فتح معاينة التنقل للمرحلة الأولى', openShell: 'فتح معاينة واجهة التطبيق المحلية', close: 'العودة إلى اختبارات الجدوى', notice: 'معاينة التنقل: الميزات غير متاحة بعد.', shellNotice: 'معاينة تجريبية للواجهة. الذكاء الاصطناعي والتنفيذ غير متاحين في هذه الشاشة.' },
} as const;

export default function PreviewRoot() {
  const [destination, dispatch] = useReducer(previewDestination, 'feasibility');
  const preview = destination !== 'feasibility';
  const language = useAppLanguage();
  const t = labels[language];
  return <View style={[styles.root, { direction: language === 'ar' ? 'rtl' : 'ltr' }]}>
    <View style={preview ? styles.hidden : styles.root} accessibilityElementsHidden={preview} importantForAccessibility={preview ? 'no-hide-descendants' : 'auto'}>
      <Pressable accessibilityRole="button" onPress={() => dispatch('open-navigation')} style={styles.button}><Text style={styles.text}>{t.open}</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => dispatch('open-shell')} style={styles.button}><Text style={styles.text}>{t.openShell}</Text></Pressable>
      <FeasibilityApp />
    </View>
    {preview && <View style={styles.root}>
      <Text style={styles.notice}>{destination === 'shell' ? t.shellNotice : t.notice}</Text>
      <Pressable accessibilityRole="button" onPress={() => dispatch('close')} style={styles.button}><Text style={styles.text}>{t.close}</Text></Pressable>
      <AppLanguageProvider>{destination === 'shell' ? <ShellPreview /> : <NavigationPreview />}</AppLanguageProvider>
    </View>}
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.background },
  hidden: { display: 'none' },
  button: { minHeight: tokens.touch.minTarget_dp, alignItems: 'center', justifyContent: 'center', padding: tokens.spacing_dp.sm, backgroundColor: tokens.color.primaryLight },
  text: { color: tokens.color.textPrimary, fontSize: tokens.typography_sp.bodySmall.size, textAlign: 'center' },
  notice: { color: tokens.color.textSecondary, fontSize: tokens.typography_sp.caption.size, textAlign: 'center', padding: tokens.spacing_dp.xs },
});
