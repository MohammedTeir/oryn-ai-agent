import { useState } from 'react';
import { I18nManager, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import tokens from '../../../docs/design/tokens.json';

type Tab = 'agent' | 'terminal';
type Segment = 'terminal' | 'tools' | 'history';
const copy = {
  en: { agent: 'AI Agent', terminal: 'Terminal & Tools', tools: 'Tools', history: 'History', settings: 'Settings', back: 'Back', unavailable: 'Not available yet', unknown: 'Connection: Unknown' },
  ar: { agent: 'المساعد الذكي', terminal: 'الطرفية والأدوات', tools: 'الأدوات', history: 'السجل', settings: 'الإعدادات', back: 'رجوع', unavailable: 'غير متاح بعد', unknown: 'الاتصال: غير معروف' },
} as const;

export default function MilestoneOneApp() {
  const t = copy[I18nManager.isRTL ? 'ar' : 'en'];
  const [tab, setTab] = useState<Tab>('agent');
  const [segment, setSegment] = useState<Segment>('terminal');
  const [settings, setSettings] = useState(false);
  const button = (label: string, onPress: () => void, selected = false) => <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} onPress={onPress} style={styles.button}><Text style={styles.text}>{label}</Text></Pressable>;
  return <View style={styles.root}>
    <View style={styles.header}><Text style={styles.title}>ORYN</Text><Text style={styles.text}>{t.unknown}</Text>{button(settings ? t.back : t.settings, () => setSettings(!settings))}</View>
    <ScrollView contentContainerStyle={styles.content}>
      {settings ? <Text style={styles.title}>{t.settings}</Text> : <>
        <Text style={styles.title}>{tab === 'agent' ? t.agent : t.terminal}</Text>
        {tab === 'terminal' && <View style={styles.row}>{(['terminal', 'tools', 'history'] as Segment[]).map(item => <View key={item}>{button(item === 'terminal' ? t.terminal : t[item], () => setSegment(item), item === segment)}</View>)}</View>}
      </>}
      <Text style={styles.text}>{t.unavailable}</Text>
    </ScrollView>
    <View style={styles.row}>{button(t.agent, () => { setSettings(false); setTab('agent'); }, !settings && tab === 'agent')}{button(t.terminal, () => { setSettings(false); setTab('terminal'); }, !settings && tab === 'terminal')}</View>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.background },
  header: { padding: tokens.spacing_dp.lg, gap: tokens.spacing_dp.sm },
  content: { flexGrow: 1, padding: tokens.spacing_dp.xl, gap: tokens.spacing_dp.lg },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing_dp.sm },
  button: { minHeight: tokens.touch.minTarget_dp, padding: tokens.spacing_dp.md, justifyContent: 'center' },
  title: { fontSize: tokens.typography_sp.H3.size, color: tokens.color.textPrimary },
  text: { fontSize: tokens.typography_sp.body.size, color: tokens.color.textPrimary },
});
