import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import tokens from '../../docs/design/tokens.json';
import FeasibilityApp from './App';
import NavigationPreview from './milestone1/App';
import { useAppLanguage } from './useAppLanguage';
import { PreviewLanguageProvider } from './milestone1/PreviewLanguage';

const labels = {
  en: { open: 'Open Milestone 1 navigation preview', close: 'Return to feasibility tests', notice: 'Navigation preview: features are not yet available.' },
  ar: { open: 'فتح معاينة التنقل للمرحلة الأولى', close: 'العودة إلى اختبارات الجدوى', notice: 'معاينة التنقل: الميزات غير متاحة بعد.' },
} as const;

export default function PreviewRoot() {
  const [preview, setPreview] = useState(false);
  const language = useAppLanguage();
  const t = labels[language];
  return <View style={[styles.root, { direction: language === 'ar' ? 'rtl' : 'ltr' }]}>
    <View style={preview ? styles.hidden : styles.root} accessibilityElementsHidden={preview} importantForAccessibility={preview ? 'no-hide-descendants' : 'auto'}>
      <Pressable accessibilityRole="button" onPress={() => setPreview(true)} style={styles.button}><Text style={styles.text}>{t.open}</Text></Pressable>
      <FeasibilityApp />
    </View>
    {preview && <View style={styles.root}>
      <Text style={styles.notice}>{t.notice}</Text>
      <Pressable accessibilityRole="button" onPress={() => setPreview(false)} style={styles.button}><Text style={styles.text}>{t.close}</Text></Pressable>
      <PreviewLanguageProvider><NavigationPreview /></PreviewLanguageProvider>
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
