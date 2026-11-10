import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import tokens from '../../../docs/design/tokens.json';
import type { AppLanguage } from '../language';
import { strings } from '../milestone1/strings';
import { createAppConversationRepository } from '../storage/appConversations';
import type { ConversationCursor } from '../storage/conversations';
import { loadConversationList, type ConversationListPage } from './conversationList';
import { ActionButton } from './components/ActionButton';
import { StatusMessage } from './components/StatusMessage';
const repo = createAppConversationRepository();
export function ConversationPicker({ language, onSelect, onClose }: { language: AppLanguage; onSelect: (id: string) => void; onClose: () => void }) {
  const t = strings[language];
  const [page, setPage] = useState<ConversationListPage | { kind: 'loading' }>({ kind: 'loading' });
  const [cursors, setCursors] = useState<(ConversationCursor | null)[]>([null]);
  const generation = useRef(0);
  useEffect(() => {
    const ref = generation; const current = ++ref.current;
    void loadConversationList(repo, null).then(value => { if (current === ref.current) setPage(value); });
    return () => { ref.current++; };
  }, []);
  const show = async (next: (ConversationCursor | null)[]) => {
    const current = ++generation.current; setPage({ kind: 'loading' });
    const value = await loadConversationList(repo, next[next.length - 1]);
    if (current !== generation.current) return;
    if (value.kind === 'loaded') setCursors(next);
    setPage(value);
  };
  const next = () => {
    if (page.kind !== 'loaded' || !page.mayHaveMore || !page.conversations.length) return;
    const last = page.conversations[page.conversations.length - 1];
    void show([...cursors, { id: last.id, updatedAt: last.updatedAt }]);
  };
  return <View style={styles.container}>
    <Text accessibilityRole="header" style={styles.text}>{t.conversationPickerTitle}</Text>
    {page.kind === 'loading' && <StatusMessage message={t.conversationsLoading} />}
    {page.kind === 'error' && <><StatusMessage message={t.conversationsError} error /><ActionButton label={t.conversationsRefresh} onPress={() => void show(cursors)} /></>}
    {page.kind === 'loaded' && page.conversations.length === 0 && <Text style={styles.text}>{cursors.length > 1 ? t.conversationPageEmpty : t.conversationsEmpty}</Text>}
    {page.kind === 'loaded' && page.conversations.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${t.conversationSelect}: ${item.id}`} onPress={() => onSelect(item.id)} style={styles.button}><Text style={styles.text}>{t.conversationSelect}</Text><Text selectable style={styles.identifier}>{item.id}</Text></Pressable>)}
    {page.kind === 'loaded' && cursors.length > 1 && <ActionButton label={t.messagesPrevious} onPress={() => void show(cursors.slice(0, -1))} />}
    {page.kind === 'loaded' && page.mayHaveMore && <ActionButton label={t.messagesNext} onPress={next} />}
    <ActionButton label={t.close} onPress={onClose} />
  </View>;
}
const styles = StyleSheet.create({
  container: { gap: tokens.spacing_dp.sm },
  text: { color: tokens.color.textPrimary, fontSize: tokens.typography_sp.bodySmall.size },
  identifier: { color: tokens.color.textSecondary, fontSize: tokens.typography_sp.caption.size, writingDirection: 'ltr', textAlign: 'left' },
  button: { minHeight: tokens.touch.minTarget_dp, padding: tokens.spacing_dp.sm, justifyContent: 'center', backgroundColor: tokens.color.primaryLight, borderRadius: tokens.radius_dp.md },
});
