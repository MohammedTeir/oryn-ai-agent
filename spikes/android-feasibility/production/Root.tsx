import { Component, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import tokens from '../../../docs/design/tokens.json';
import { strings } from '../milestone1/strings';
import { AppLanguageProvider } from '../milestone1/AppLanguage';
import App from './App';

class RootBoundary extends Component<{ message: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <View style={styles.root}><Text accessibilityRole="alert" style={styles.text}>{this.props.message}</Text></View>;
    return this.props.children;
  }
}
export default function ProductionRoot() {
  return <RootBoundary message={`${strings.en.shellError}\n${strings.ar.shellError}`}><AppLanguageProvider><App /></AppLanguageProvider></RootBoundary>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.background, justifyContent: 'center', padding: tokens.spacing_dp.xl },
  text: { color: tokens.color.textPrimary, fontSize: tokens.typography_sp.body.size, textAlign: 'center' },
});
