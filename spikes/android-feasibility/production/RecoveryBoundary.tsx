import { Component, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import tokens from '../../../docs/design/tokens.json';

export class RecoveryBoundary extends Component<{ message: string; retryLabel: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <View style={styles.root}>
      <Text accessibilityRole="alert" style={styles.text}>{this.props.message}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={this.props.retryLabel} onPress={() => this.setState({ failed: false })} style={styles.button}><Text style={styles.text}>{this.props.retryLabel}</Text></Pressable>
    </View>;
  }
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.background, justifyContent: 'center', padding: tokens.spacing_dp.xl, gap: tokens.spacing_dp.md },
  text: { color: tokens.color.textPrimary, fontSize: tokens.typography_sp.body.size, textAlign: 'center' },
  button: { minHeight: tokens.touch.minTarget_dp, padding: tokens.spacing_dp.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.primaryLight, borderRadius: tokens.radius_dp.md },
});
