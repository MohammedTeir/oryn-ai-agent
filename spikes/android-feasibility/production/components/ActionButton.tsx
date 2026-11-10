import { candidateTypography } from '../typography';
import { Pressable, StyleSheet, Text } from 'react-native';
import tokens from '../../../../docs/design/tokens.json';

export function ActionButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={disabled ? undefined : onPress} style={[styles.button, disabled && styles.disabled]}>
    <Text style={styles.text}>{label}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({
  button: { minHeight: tokens.touch.minTarget_dp, padding: tokens.spacing_dp.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.primaryLight, borderRadius: tokens.radius_dp.md },
  disabled: { backgroundColor: tokens.color.disabled },
  text: { color: tokens.color.textPrimary, fontSize: tokens.typography_sp.bodySmall.size, fontFamily: candidateTypography.regular, textAlign: 'center' },
});
