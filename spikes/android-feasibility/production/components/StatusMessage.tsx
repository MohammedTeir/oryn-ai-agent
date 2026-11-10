import { StyleSheet, Text } from 'react-native';
import tokens from '../../../../docs/design/tokens.json';

export function StatusMessage({ message, error = false }: { message: string; error?: boolean }) {
  return <Text accessibilityRole={error ? 'alert' : undefined} accessibilityLiveRegion="polite" style={styles.text}>{message}</Text>;
}
const styles = StyleSheet.create({ text: { color: tokens.color.textPrimary, fontSize: tokens.typography_sp.bodySmall.size } });
