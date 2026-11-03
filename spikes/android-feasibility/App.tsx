import { useState } from 'react';
import { I18nManager, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import tokens from '../../docs/design/tokens.json';
import { observe } from './modules/oryn-observer';
import { strings } from './strings';

export default function App() {
  const t = strings[I18nManager.isRTL ? 'ar' : 'en'];
  const [result, setResult] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  async function refresh() {
    setPending(true);
    setFailed(false);
    setResult(null);
    try {
      setResult(JSON.stringify(await observe(), null, 2));
    } catch {
      // No exception payloads: future native errors may contain sensitive details.
      setFailed(true);
    } finally {
      setPending(false);
    }
  }
  return <ScrollView contentContainerStyle={styles.page}>
    <Text style={styles.title}>{t.title}</Text>
    <Text style={styles.text}>{t.scope}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={t.observe} disabled={pending} onPress={refresh} style={styles.button}>
      <Text style={styles.text}>{t.observe}</Text>
    </Pressable>
    <View accessibilityLiveRegion="polite">
      <Text selectable style={result ? styles.code : styles.text}>{pending ? t.checking : failed ? t.error : result ?? t.unknown}</Text>
    </View>
  </ScrollView>;
}
const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: tokens.spacing_dp.xl, gap: tokens.spacing_dp.lg, backgroundColor: tokens.color.background },
  title: { fontSize: tokens.typography_sp.H3.size, color: tokens.color.textPrimary },
  text: { fontSize: tokens.typography_sp.body.size, color: tokens.color.textPrimary },
  button: { minHeight: tokens.touch.minTarget_dp, padding: tokens.spacing_dp.md, borderRadius: tokens.radius_dp.md, backgroundColor: tokens.color.primaryLight },
  code: { writingDirection: 'ltr', textAlign: 'left', fontSize: tokens.typography_sp.bodySmall.size, color: tokens.color.textPrimary },
});
