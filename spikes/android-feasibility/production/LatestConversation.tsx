import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import tokens from '../../../docs/design/tokens.json';
import type { AppLanguage } from '../language';
import { strings } from '../milestone1/strings';
import { createAppConversationRepository } from '../storage/appConversations';
import { loadLatestConversation, loadMessagePage, type LatestConversation as Result } from './latestConversation';
import type { MessageCursor } from '../storage/conversations';
import { newMessageIds } from './messageIds';
import { ConversationPicker } from './ConversationPicker';
import type { PendingMessage } from './localMessage';
import { checkDurable, fromRecord, retryDurable, stageAndSave, toRecord, type DurableState } from './durableMessage';
import { createPendingMessageStore } from '../storage/pendingMessage';
import { openLocalDatabase } from '../storage/database';
import { ActionButton } from './components/ActionButton';

const repository = createAppConversationRepository();
const pendingStore = createPendingMessageStore(openLocalDatabase);
export function LatestConversation({ language }: { language: AppLanguage }) {
  const t = strings[language];
  const [result, setResult] = useState<Result | { kind: 'loading' }>({ kind: 'loading' });
  const generation = useRef(0);
  const [pages, setPages] = useState<(MessageCursor | null)[]>([null]);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState(false);
  const busy = useRef(false);
  const pending = useRef<PendingMessage | null>(null);
  const [draft, setDraft] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [saveState, setSaveState] = useState<DurableState | 'idle' | 'saving'>('idle');
  const [recovery, setRecovery] = useState<'loading' | 'ready' | 'error'>('loading');
  const reload = useCallback((conversationId?: string) => {
    const current = ++generation.current;
    setPages([null]); setPageLoading(false); setPageError(false);
    setResult({ kind: 'loading' });
    const request = conversationId ? loadMessagePage(repository, conversationId, null) : loadLatestConversation(repository);
    void request.then(value => { if (current === generation.current) setResult(value); });
  }, []);
  useEffect(() => {
    const ref = generation;
    const current = ++ref.current;
    void loadLatestConversation(repository).then(value => { if (current === ref.current) setResult(value); });
    return () => { ref.current++; };
  }, []);
  const restore = useCallback(async () => {
    const loaded = await pendingStore.read();
    if (!loaded.ok) { setRecovery('error'); return; }
    if (loaded.value) { pending.current = fromRecord(loaded.value); setDraft(loaded.value.content); setSaveState('unknown'); }
    else { pending.current = null; setSaveState('idle'); }
    setRecovery('ready');
  }, []);
  useEffect(() => {
    let active = true;
    void pendingStore.read().then(loaded => {
      if (!active) return;
      if (!loaded.ok) { setRecovery('error'); return; }
      if (loaded.value) { pending.current = fromRecord(loaded.value); setDraft(loaded.value.content); setSaveState('unknown'); }
      setRecovery('ready');
    });
    return () => { active = false; };
  }, []);
  const showPage = async (cursors: (MessageCursor | null)[]) => {
    if (result.kind !== 'loaded' || pageLoading) return;
    const current = ++generation.current;
    setPageLoading(true); setPageError(false);
    const page = await loadMessagePage(repository, result.conversationId, cursors[cursors.length - 1]);
    if (current !== generation.current) return;
    setPageLoading(false);
    if (page.kind === 'error') { setPageError(true); return; }
    setPages(cursors); setResult(page);
  };
  const nextPage = () => {
    if (result.kind !== 'loaded' || !result.mayHaveMore || !result.messages.length) return;
    const last = result.messages[result.messages.length - 1];
    void showPage([...pages, { createdAt: last.createdAt, id: last.id }]);
  };
  const finish = (state: DurableState) => {
    setSaveState(state);
    if (state === 'saved') { const savedConversation = pending.current?.conversationId; pending.current = null; setDraft(''); reload(savedConversation); }
    if (state === 'not_staged') pending.current = null;
    busy.current = false;
  };
  const save = async () => {
    if (busy.current || pending.current || !draft.trim() || draft.length > 20000 || (result.kind !== 'empty' && result.kind !== 'loaded')) return;
    busy.current = true; setSaveState('saving');
    const ids = await newMessageIds();
    if (!ids) { busy.current = false; setSaveState('not_staged'); return; }
    const record = { conversationId: result.kind === 'loaded' ? result.conversationId : ids.conversationId, messageId: ids.messageId, content: draft, timestamp: Date.now(), newConversation: result.kind === 'empty' };
    pending.current = record;
    finish(await stageAndSave(pendingStore, repository, record));
  };
  const check = async () => {
    if (busy.current || !pending.current) return;
    busy.current = true; setSaveState('saving');
    finish(await checkDurable(pendingStore, repository, pending.current));
  };
  const retry = async () => {
    if (busy.current || !pending.current) return;
    busy.current = true; setSaveState('saving');
    finish(await retryDurable(pendingStore, repository, pending.current));
  };
  const discard = () => {
    if (busy.current || !pending.current) return;
    Alert.alert(t.messageDiscardTitle, t.messageDiscardConfirm, [
      { text: t.close, style: 'cancel' },
      { text: t.messageDiscard, style: 'destructive', onPress: () => {
        if (busy.current || !pending.current) return;
        busy.current = true; setSaveState('saving');
        const record = pending.current;
        void pendingStore.discardIfUnwritten(toRecord(record)).then(result => {
          if (result.ok) { pending.current = null; setDraft(''); setSaveState('idle'); busy.current = false; }
          else { busy.current = false; setSaveState('unknown'); }
        });
      } },
    ]);
  };
  if (recovery !== 'ready') return <View style={styles.container}><Text accessibilityLiveRegion="polite" style={styles.text}>{recovery === 'loading' ? t.messageRecoveryLoading : t.messageRecoveryError}</Text>{recovery === 'error' && <Pressable accessibilityRole="button" onPress={() => void restore()} style={styles.button}><Text style={styles.text}>{t.messageCheck}</Text></Pressable>}</View>;
  if (showPicker) return <ConversationPicker language={language} onClose={() => setShowPicker(false)} onSelect={id => { setShowPicker(false); reload(id); }} />;
  const selectionDisabled = saveState === 'saving' || saveState === 'unknown' || saveState === 'conflict' || saveState === 'not_saved';
  return <View style={styles.container}>
    <Text style={styles.text}>{t.localOnlyNotice}</Text>
    <Pressable accessibilityRole="button" disabled={selectionDisabled} accessibilityState={{ disabled: selectionDisabled }} onPress={() => { if (!busy.current && !pending.current) setShowPicker(true); }} style={styles.button}><Text style={styles.text}>{t.conversationPickerTitle}</Text></Pressable>
    <Pressable accessibilityRole="button" disabled={selectionDisabled} accessibilityState={{ disabled: selectionDisabled }} onPress={() => { if (busy.current || pending.current) return; generation.current++; setResult({ kind: 'empty' }); setPages([null]); setPageLoading(false); setPageError(false); }} style={styles.button}><Text style={styles.text}>{t.conversationNew}</Text></Pressable>
    {result.kind === 'loaded' && <View><Text style={styles.text}>{t.conversationActive}</Text><Text selectable style={styles.identifier}>{result.conversationId}</Text></View>}
    {!!draft && <Text style={styles.text}>{t.conversationDraft}</Text>}
    <View accessibilityLiveRegion="polite">
      {result.kind === 'loading' && <Text style={styles.text}>{t.conversationsLoading}</Text>}
      {result.kind === 'error' && <Text style={styles.text}>{t.conversationsError}</Text>}
      {result.kind === 'empty' && <Text style={styles.text}>{t.conversationNewReady}</Text>}
      {result.kind === 'loaded' && result.messages.map(message => <View key={message.id} style={styles.message}><Text selectable style={styles.text}>{message.content}</Text></View>)}
      {result.kind === 'loaded' && result.messages.length === 0 && <Text style={styles.text}>{pages.length > 1 ? t.messagesPageEmpty : t.messagesEmpty}</Text>}
      {result.kind === 'loaded' && result.mayHaveMore && <Text style={styles.text}>{t.messagesLimited}</Text>}
      {pageLoading && <Text style={styles.text}>{t.conversationsLoading}</Text>}
      {pageError && <Text style={styles.text}>{t.conversationsError}</Text>}
    </View>
    {result.kind === 'loaded' && pages.length > 1 && <ActionButton label={t.messagesPrevious} disabled={pageLoading} onPress={() => void showPage(pages.slice(0, -1))} />}
    {result.kind === 'loaded' && result.mayHaveMore && <ActionButton label={t.messagesNext} disabled={pageLoading} onPress={nextPage} />}
    <TextInput accessibilityLabel={t.messageInput} placeholder={t.messageInput} placeholderTextColor={tokens.color.textSecondary} multiline value={draft} onChangeText={setDraft} maxLength={20000} editable={saveState !== 'saving' && saveState !== 'unknown' && saveState !== 'conflict' && saveState !== 'not_saved'} style={styles.input} />
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !draft.trim() || saveState === 'saving' || saveState === 'unknown' || saveState === 'conflict' || saveState === 'not_saved' || (result.kind !== 'empty' && result.kind !== 'loaded') }} disabled={!draft.trim() || saveState === 'saving' || saveState === 'unknown' || saveState === 'conflict' || saveState === 'not_saved' || (result.kind !== 'empty' && result.kind !== 'loaded')} onPress={() => void save()} style={styles.button}><Text style={styles.text}>{t.messageSave}</Text></Pressable>
    <View accessibilityLiveRegion="polite"><Text style={styles.text}>{saveState === 'saving' ? t.messageSaving : saveState === 'saved' ? t.messageSaved : saveState === 'not_saved' ? t.messageRetryNeeded : saveState === 'not_staged' ? t.messageNotSaved : saveState === 'unknown' ? t.messageUnknown : saveState === 'conflict' ? t.messageConflict : ''}</Text></View>
    {saveState === 'not_saved' && <><Pressable accessibilityRole="button" onPress={() => void retry()} style={styles.button}><Text style={styles.text}>{t.messageRetry}</Text></Pressable><Pressable accessibilityRole="button" onPress={discard} style={styles.button}><Text style={styles.text}>{t.messageDiscard}</Text></Pressable></>}
    {saveState === 'conflict' && <Pressable accessibilityRole="button" onPress={() => Alert.alert(t.messageReviewTitle, t.messageReviewConfirm, [{ text: t.close, style: 'cancel' }, { text: t.messageReview, onPress: () => void restore() }])} style={styles.button}><Text style={styles.text}>{t.messageReview}</Text></Pressable>}
    {(saveState === 'unknown' || saveState === 'conflict') && <Pressable accessibilityRole="button" onPress={() => void check()} style={styles.button}><Text style={styles.text}>{t.messageCheck}</Text></Pressable>}
    <Pressable accessibilityRole="button" disabled={selectionDisabled} accessibilityState={{ disabled: selectionDisabled }} onPress={() => reload(result.kind === 'loaded' ? result.conversationId : undefined)} style={styles.button}><Text style={styles.text}>{t.conversationsRefresh}</Text></Pressable>
  </View>;
}
const styles = StyleSheet.create({
  container: { gap: tokens.spacing_dp.md },
  message: { padding: tokens.spacing_dp.md, marginVertical: tokens.spacing_dp.xs, backgroundColor: tokens.color.surface, borderRadius: tokens.radius_dp.md },
  text: { color: tokens.color.textPrimary, fontSize: tokens.typography_sp.bodySmall.size },
  identifier: { color: tokens.color.textSecondary, fontSize: tokens.typography_sp.caption.size, writingDirection: 'ltr', textAlign: 'left' },
  input: { minHeight: tokens.touch.minTarget_dp, padding: tokens.spacing_dp.md, color: tokens.color.textPrimary, fontSize: tokens.typography_sp.body.size, borderColor: tokens.color.border, borderWidth: tokens.elevation_dp.subtle, borderRadius: tokens.radius_dp.md },
  button: { minHeight: tokens.touch.minTarget_dp, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.primaryLight, borderRadius: tokens.radius_dp.md },
});
