import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import tokens from '../../../docs/design/tokens.json';
import type { AppLanguage } from '../language';
import { strings } from '../milestone1/strings';
import { createAppConversationRepository } from '../storage/appConversations';
import { loadLatestConversation, type LatestConversation as Result } from './latestConversation';

const repository = createAppConversationRepository();
export function LatestConversation({ language }: { language: AppLanguage }) {
  const t = strings[language];
  const [result, setResult] = useState<Result | { kind: 'loading' }>({ kind: 'loading' });
  const generation = useRef(0);
  const reload = useCallback(() => {
    const current = ++generation.current;
    setResult({ kind: 'loading' });
    void loadLatestConversation(repository).then(value => { if (current === generation.current) setResult(value); });
  }, []);
  useEffect(() => {
    const ref = generation;
    const current = ++ref.current;
    void loadLatestConversation(repository).then(value => { if (current === ref.current) setResult(value); });
    return () => { ref.current++; };
  }, []);
  return <View style={styles.container}>
    <Text style={styles.text}>{t.localOnlyNotice}</Text>
    <View accessibilityLiveRegion="polite">
      {result.kind === 'loading' && <Text style={styles.text}>{t.conversationsLoading}</Text>}
      {result.kind === 'error' && <Text style={styles.text}>{t.conversationsError}</Text>}
      {result.kind === 'empty' && <Text style={styles.text}>{t.conversationsEmpty}</Text>}
      {result.kind === 'loaded' && result.messages.map(message => <View key={message.id} style={styles.message}><Text selectable style={styles.text}>{message.content}</Text></View>)}
      {result.kind === 'loaded' && result.messages.length === 0 && <Text style={styles.text}>{t.messagesEmpty}</Text>}
      {result.kind === 'loaded' && result.mayHaveMore && <Text style={styles.text}>{t.messagesLimited}</Text>}
    </View>
    <Pressable accessibilityRole="button" onPress={reload} style={styles.button}><Text style={styles.text}>{t.conversationsRefresh}</Text></Pressable>
  </View>;
}
const styles = StyleSheet.create({
  container: { gap: tokens.spacing_dp.md },
  message: { padding: tokens.spacing_dp.md, marginVertical: tokens.spacing_dp.xs, backgroundColor: tokens.color.surface, borderRadius: tokens.radius_dp.md },
  text: { color: tokens.color.textPrimary, fontSize: tokens.typography_sp.bodySmall.size },
  button: { minHeight: tokens.touch.minTarget_dp, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.primaryLight, borderRadius: tokens.radius_dp.md },
});
