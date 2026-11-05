import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, I18nManager, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import tokens from '../../docs/design/tokens.json';
import { checkMissingAndForgedGrant, copyEvidence, getExecutionState, observe, requestCancel, requestProbe, saveEvidence, type ProbeId } from './modules/oryn-observer';
import { appendEvidence, createReport, parseExportStatus, parseNativeRecord, type ExportStatus, type EvidenceEntry, type NativeRecord } from './report';
import { strings } from './strings';

const probeIds: ProbeId[] = ['native_echo', 'native_timeout', 'native_cancel', 'termux_echo', 'termux_delay'];

function ProbeButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }}
    disabled={disabled} onPress={onPress} style={styles.button}>
    <Text style={styles.text}>{label}</Text>
  </Pressable>;
}

export default function App() {
  const t = strings[I18nManager.isRTL ? 'ar' : 'en'];
  const [observation, setObservation] = useState<NativeRecord | null>(null);
  const [nativeState, setNativeState] = useState<NativeRecord | null>(null);
  const [entries, setEntries] = useState<EvidenceEntry[]>([]);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [exportStatus, setExportStatus] = useState<ExportStatus | null>(null);
  const [busy, setBusy] = useState<boolean | null>(null);
  const requestPending = useRef(false);
  const reading = useRef(false);
  const lastState = useRef<string | null>(null);
  const capture = useCallback((source: string, value: NativeRecord) => {
    const entry = { capturedAtEpochMs: Date.now(), source, value };
    setEntries(previous => appendEvidence(previous, entry));
  }, []);
  const refreshState = useCallback(async () => {
    if (reading.current) return;
    reading.current = true;
    try {
      const raw = await getExecutionState();
      const value = parseNativeRecord(raw);
      setBusy(typeof value.executionBusy === 'boolean' ? value.executionBusy : null);
      setNativeState(value);
      if (lastState.current !== raw) {
        lastState.current = raw;
        capture('native.getState', value);
      }
    } catch {
      setBusy(null);
      setFailed(true);
    } finally { reading.current = false; }
  }, [capture]);

  // State reads only. No lifecycle hook, timer or retry can request execution.
  useEffect(() => {
    const initialRead = setTimeout(() => void refreshState(), 0);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void refreshState();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void refreshState();
    }, 1000);
    return () => { subscription.remove(); clearInterval(timer); clearTimeout(initialRead); };
  }, [refreshState]);

  async function run(source: string, action: () => Promise<void>) {
    if (requestPending.current) return;
    requestPending.current = true;
    setPending(true); setFailed(false);
    try { await action(); }
    catch {
      // Never include exception payloads in shared reports.
      capture(source, { error: 'native_call_or_share_failed' });
      setFailed(true);
    } finally {
      requestPending.current = false;
      setPending(false);
      await refreshState();
    }
  }
  const report = JSON.stringify(createReport(observation, entries), null, 2);
  return <ScrollView contentContainerStyle={styles.page}>
    <Text style={styles.title}>{t.title}</Text>
    <Text style={styles.text}>{t.scope}</Text>
    <ProbeButton label={t.copy} disabled={pending} onPress={() => {
      setExportStatus(null);
      void run('copy', async () => { setExportStatus(parseExportStatus(await copyEvidence(report), 'copy')); });
    }} />
    <ProbeButton label={t.save} disabled={pending} onPress={() => {
      setExportStatus(null);
      void run('save', async () => { setExportStatus(parseExportStatus(await saveEvidence(report), 'save')); });
    }} />
    <ProbeButton label={t.share} disabled={pending} onPress={() => {
      setExportStatus(null);
      void run('share', async () => { await Share.share({ message: report }); });
    }} />
    <Text style={styles.text}>{t.exportHint}</Text>
    <View accessibilityLiveRegion="polite">
      {exportStatus !== null && <Text style={styles.text}>{t.exportStatus[exportStatus]}</Text>}
    </View>

    <ProbeButton label={t.observe} disabled={pending} onPress={() => void run('native.observe', async () => {
      const value = { ...await observe() };
      setObservation(value); capture('native.observe', value);
    })} />
    <ProbeButton label={t.denied} disabled={pending} onPress={() => void run('native.negativeProbe', async () => {
      const results = await checkMissingAndForgedGrant();
      results.forEach(raw => capture('native.negativeProbe', parseNativeRecord(raw)));
    })} />
    <Text style={styles.text}>{t.setup}</Text>
    {probeIds.map(id => <View key={id}>
      <ProbeButton label={t[id]} disabled={pending || busy !== false} onPress={() => void run(`native.requestProbe.${id}`, async () => {
        capture(`native.requestProbe.${id}`, parseNativeRecord(await requestProbe(id)));
      })} />
      {id === 'native_cancel' && <ProbeButton label={t.cancel} disabled={pending || busy !== true} onPress={() => void run('native.requestCancel', async () => {
        capture('native.requestCancel', parseNativeRecord(await requestCancel()));
      })} />}
    </View>)}
    <ProbeButton label={t.refresh} disabled={pending} onPress={() => void run('native.getState', refreshState)} />
    <Text style={styles.text}>{t.lifecycle}</Text>
    <View accessibilityLiveRegion="polite">
      <Text style={styles.text}>{pending ? t.checking : failed ? t.error : t.execution}</Text>
    </View>
    <Text selectable style={styles.code}>{nativeState ? JSON.stringify(nativeState, null, 2) : t.unknown}</Text>

    <Text style={styles.text}>{t.report}</Text>
    <Text selectable style={styles.code}>{report}</Text>
  </ScrollView>;
}
const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: tokens.spacing_dp.xl, gap: tokens.spacing_dp.lg, backgroundColor: tokens.color.background },
  title: { fontSize: tokens.typography_sp.H3.size, color: tokens.color.textPrimary },
  text: { fontSize: tokens.typography_sp.body.size, color: tokens.color.textPrimary },
  button: { minHeight: tokens.touch.minTarget_dp, padding: tokens.spacing_dp.md, borderRadius: tokens.radius_dp.md, backgroundColor: tokens.color.primaryLight },
  code: { writingDirection: 'ltr', textAlign: 'left', fontSize: tokens.typography_sp.bodySmall.size, color: tokens.color.textPrimary },
});
