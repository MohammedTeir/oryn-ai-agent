import { useReducer } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import tokens from '../../../docs/design/tokens.json';
import { useStoredLanguage } from './AppLanguage';
import { exampleNavigation, initialExampleState } from './approvalExampleState';

// This is an illustrative fixture, not a proposal or an authorization surface.
// It deliberately has no approval callback and cannot invoke a native gateway.
const example = { executable: 'echo', argument: 'ORYN', command: 'echo ORYN' } as const;
const copy = {
  en: {
    open: 'View approval card example', close: 'Close example', title: 'Approval card example',
    warning: 'Example only. This is not a real command or approval. Execution is unavailable.',
    command: 'Example command', risk: 'Example risk: Low', effects: 'Example effects: prints text.',
    root: 'Root: No (example)', network: 'Network: No (example)', deletion: 'Deletion: No (example)', outside: 'Writes outside workspace: No (example)',
    details: 'Details', executable: 'Executable', arguments: 'Arguments', directory: 'Working directory: Not specified', runtime: 'Runtime: Not specified',
    privilege: 'Privilege: Non-root (example)', environment: 'Environment variable names: None (example)', filesystem: 'Filesystem effects: None (example)', networkDetail: 'Network effects: None (example)', timeout: 'Timeout: Not specified',
    strict: 'Strict — selected by default', more: 'More approval options', batch: 'Batch: unavailable until a fixed list of commands can be reviewed.', session: 'Session: unavailable until scope can be reviewed and enforced.',
    approve: 'Approve', reject: 'Reject', disabled: 'Approval controls are unavailable in this example.',
  },
  ar: {
    open: 'عرض مثال بطاقة الموافقة', close: 'إغلاق المثال', title: 'مثال بطاقة الموافقة',
    warning: 'مثال فقط. هذا ليس أمراً حقيقياً أو موافقة، والتنفيذ غير متاح.',
    command: 'أمر المثال', risk: 'مخاطر المثال: منخفضة', effects: 'تأثير المثال: طباعة نص.',
    root: 'صلاحية الجذر: لا (مثال)', network: 'الشبكة: لا (مثال)', deletion: 'الحذف: لا (مثال)', outside: 'الكتابة خارج مساحة العمل: لا (مثال)',
    details: 'التفاصيل', executable: 'البرنامج', arguments: 'المعاملات', directory: 'مجلد العمل: غير محدد', runtime: 'بيئة التشغيل: غير محددة',
    privilege: 'الصلاحية: بدون جذر (مثال)', environment: 'أسماء متغيرات البيئة: لا يوجد (مثال)', filesystem: 'تأثيرات الملفات: لا يوجد (مثال)', networkDetail: 'تأثيرات الشبكة: لا يوجد (مثال)', timeout: 'المهلة: غير محددة',
    strict: 'الموافقة الفردية — محددة افتراضياً', more: 'المزيد من خيارات الموافقة', batch: 'الدفعة: غير متاحة حتى يمكن مراجعة قائمة أوامر ثابتة.', session: 'الجلسة: غير متاحة حتى يمكن مراجعة النطاق وفرضه.',
    approve: 'موافقة', reject: 'رفض', disabled: 'أزرار الموافقة غير متاحة في هذا المثال.',
  },
} as const;

export function ApprovalExample() {
  const { language } = useStoredLanguage();
  const t = copy[language];
  const [{ visible, details, more }, dispatch] = useReducer(exampleNavigation, initialExampleState);
  function close() { dispatch('close'); }
  return <>
    <Pressable accessibilityRole="button" onPress={() => dispatch('open')} style={styles.button}><Text style={styles.text}>{t.open}</Text></Pressable>
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View style={[styles.screen, { direction: language === 'ar' ? 'rtl' : 'ltr' }]}>
        <View style={styles.header}><Text accessibilityRole="header" style={styles.title}>{t.title}</Text><Pressable accessibilityRole="button" onPress={close} style={styles.button}><Text style={styles.text}>{t.close}</Text></Pressable></View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.notice}>{t.warning}</Text>
          <Text style={styles.label}>{t.command}</Text><Text selectable style={styles.code}>{example.command}</Text>
          <Text style={styles.label}>{t.risk}</Text><Text style={styles.text}>{t.effects}</Text>
          {[t.root, t.network, t.deletion, t.outside].map(item => <Text key={item} style={styles.text}>{item}</Text>)}
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: details }} onPress={() => dispatch('toggleDetails')} style={styles.button}><Text style={styles.text}>{t.details}</Text></Pressable>
          {details && <View style={styles.group}>
            <Text style={styles.label}>{t.executable}</Text><Text selectable style={styles.code}>{example.executable}</Text>
            <Text style={styles.label}>{t.arguments}</Text><Text selectable style={styles.code}>{example.argument}</Text>
            {[t.directory, t.runtime, t.privilege, t.environment, t.filesystem, t.networkDetail, t.timeout].map(item => <Text key={item} style={styles.text}>{item}</Text>)}
          </View>}
          <Text style={styles.label}>{t.strict}</Text>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: more }} onPress={() => dispatch('toggleMore')} style={styles.button}><Text style={styles.text}>{t.more}</Text></Pressable>
          {more && <View style={styles.group}><Text style={styles.text}>{t.batch}</Text><Text style={styles.text}>{t.session}</Text></View>}
        </ScrollView>
        <View style={styles.actions}>
          <Text style={styles.notice}>{t.disabled}</Text>
          <View style={styles.actionRow}>
            <Pressable disabled accessibilityRole="button" accessibilityState={{ disabled: true }} style={styles.disabledButton}><Text style={styles.text}>{t.reject}</Text></Pressable>
            <Pressable disabled accessibilityRole="button" accessibilityState={{ disabled: true }} style={styles.disabledButton}><Text style={styles.text}>{t.approve}</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  </>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.color.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: tokens.spacing_dp.lg, borderBottomWidth: tokens.elevation_dp.subtle, borderColor: tokens.color.border },
  title: { flex: 1, fontSize: tokens.typography_sp.H3.size, color: tokens.color.textPrimary },
  content: { padding: tokens.spacing_dp.xl, gap: tokens.spacing_dp.md },
  group: { gap: tokens.spacing_dp.sm, padding: tokens.spacing_dp.md, backgroundColor: tokens.color.surface },
  text: { fontSize: tokens.typography_sp.bodySmall.size, color: tokens.color.textPrimary },
  label: { fontSize: tokens.typography_sp.body.size, fontWeight: '600', color: tokens.color.textPrimary },
  notice: { fontSize: tokens.typography_sp.bodySmall.size, color: tokens.color.textSecondary },
  code: { writingDirection: 'ltr', textAlign: 'left', fontSize: tokens.typography_sp.body.size, color: tokens.color.textPrimary },
  button: { minHeight: tokens.touch.minTarget_dp, padding: tokens.spacing_dp.md, justifyContent: 'center', borderRadius: tokens.radius_dp.md, backgroundColor: tokens.color.primaryLight },
  actions: { padding: tokens.spacing_dp.lg, gap: tokens.spacing_dp.sm, borderTopWidth: tokens.elevation_dp.subtle, borderColor: tokens.color.border },
  actionRow: { flexDirection: 'row', gap: tokens.spacing_dp.sm },
  disabledButton: { flex: 1, minHeight: tokens.touch.minTarget_dp, padding: tokens.spacing_dp.md, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius_dp.md, backgroundColor: tokens.color.disabled },
});
