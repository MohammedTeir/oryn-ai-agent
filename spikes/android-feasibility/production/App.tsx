import { Component, useEffect, useReducer, type ReactNode } from 'react';
import { BackHandler, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import tokens from '../../../docs/design/tokens.json';
import { useStoredLanguage } from '../milestone1/AppLanguage';
import type { LanguagePreference } from '../storage/languagePreference';
import { AppIcon } from '../milestone1/AppIcon';
import { initialNavigation, navigate, type Segment } from '../milestone1/navigation';
import { strings } from '../milestone1/strings';
import { LatestConversation } from './LatestConversation';

const symbol = require('../../../assets/ORYN_Brand_Assets/03_Icon_Only/oryn-icon-only-transparent.png');
const inactive = require('../../../assets/ORYN_Brand_Assets/04_Monochrome/oryn-icon-only-mono-navy.png');
const segments: Segment[] = ['terminal', 'tools', 'history'];
const languageChoices: LanguagePreference[] = ['system', 'en', 'ar'];

class ScreenBoundary extends Component<{ children: ReactNode; message: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <View style={styles.content}><Text accessibilityRole="alert" style={styles.text}>{this.props.message}</Text></View> : this.props.children;
  }
}

export default function ProductionApp() {
  const { language, preference, status: languageStatus, select } = useStoredLanguage();
  const t = strings[language];
  const [state, dispatch] = useReducer(navigate, initialNavigation);
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!state.settings) return false;
      dispatch({ type: 'back' });
      return true;
    });
    return () => subscription.remove();
  }, [state.settings]);
  return <View style={[styles.root, { direction: language === 'ar' ? 'rtl' : 'ltr' }]}>
    <View style={styles.header}>
      <View style={styles.brand} accessible accessibilityLabel={t.brand}><Image source={symbol} style={styles.brandSymbol} resizeMode="contain" /><Text style={styles.brandText}>{t.brand}</Text></View>
      <Text style={styles.caption} accessibilityLabel={t.connectionUnknown}>{t.connectionUnknown}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={t.history} onPress={() => dispatch({ type: 'history' })} style={styles.iconButton}><AppIcon name="history" color={tokens.color.textPrimary} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={state.settings ? t.back : t.settings} onPress={() => dispatch({ type: state.settings ? 'back' : 'settings' })} style={styles.iconButton}><AppIcon name={state.settings ? (language === 'ar' ? 'backRtl' : 'back') : 'settings'} color={tokens.color.textPrimary} /></Pressable>
    </View>
    {!state.settings && (languageStatus === 'loading' || languageStatus === 'error') && <View accessibilityLiveRegion="polite"><Text style={styles.text}>{languageStatus === 'loading' ? t.languageLoading : t.languageError}</Text></View>}
    <ScreenBoundary message={t.shellError}><ScrollView contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>{state.settings ? t.settings : state.tab === 'agent' ? t.agent : t.terminalTab}</Text>
      {!state.settings && state.tab === 'terminal' && <View style={styles.segments} accessibilityRole="tablist">{segments.map(item => <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: state.segment === item }} onPress={() => dispatch({ type: 'segment', segment: item })} style={[styles.segment, state.segment === item && styles.selected]}><Text style={styles.text}>{t[item]}</Text></Pressable>)}</View>}
      {state.settings ? <View style={styles.languageGroup}>
        <Text accessibilityRole="header" style={styles.text}>{t.shellLanguageTitle}</Text>
        {languageChoices.map(choice => <Pressable key={choice} accessibilityRole="radio" accessibilityState={{ checked: languageStatus === 'ready' && preference === choice, disabled: languageStatus === 'loading' || languageStatus === 'saving' }} disabled={languageStatus === 'loading' || languageStatus === 'saving'} onPress={() => void select(choice)} style={[styles.languageChoice, languageStatus === 'ready' && preference === choice && styles.selected]}><Text style={styles.text}>{t.languages[choice]}{languageStatus === 'ready' && preference === choice ? ` · ${t.selected}` : ''}</Text></Pressable>)}
        <View accessibilityLiveRegion="polite"><Text style={styles.text}>{languageStatus === 'loading' ? t.languageLoading : languageStatus === 'saving' ? t.languageSaving : languageStatus === 'error' ? t.languageError : t.languageSaved}</Text></View>
      </View> : state.tab === 'agent' ? <LatestConversation language={language} /> : <Text style={styles.text}>{t.unavailable}</Text>}
    </ScrollView></ScreenBoundary>
    <View style={styles.navigation} accessibilityRole="tablist">
      <Pressable accessibilityRole="tab" accessibilityState={{ selected: !state.settings && state.tab === 'agent' }} onPress={() => dispatch({ type: 'tab', tab: 'agent' })} style={[styles.tab, !state.settings && state.tab === 'agent' && styles.selected]}><Image source={!state.settings && state.tab === 'agent' ? symbol : inactive} style={styles.tabSymbol} resizeMode="contain" /><Text style={styles.text}>{t.agent}</Text></Pressable>
      <Pressable accessibilityRole="tab" accessibilityState={{ selected: !state.settings && state.tab === 'terminal' }} onPress={() => dispatch({ type: 'tab', tab: 'terminal' })} style={[styles.tab, !state.settings && state.tab === 'terminal' && styles.selected]}><AppIcon name="terminal" color={tokens.color.textPrimary} /><Text style={styles.text}>{t.terminalTab}</Text></Pressable>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: tokens.spacing_dp.sm, borderBottomWidth: tokens.elevation_dp.subtle, borderColor: tokens.color.border },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  brandSymbol: { width: tokens.spacing_dp.xxl, height: tokens.spacing_dp.xxl },
  brandText: { color: tokens.brand.wordmarkNavy, fontSize: tokens.typography_sp.H4.size, fontWeight: '700' },
  caption: { color: tokens.color.textSecondary, fontSize: tokens.typography_sp.caption.size, flexShrink: 1 },
  iconButton: { minWidth: tokens.touch.minTarget_dp, minHeight: tokens.touch.minTarget_dp, alignItems: 'center', justifyContent: 'center' },
  content: { flexGrow: 1, padding: tokens.spacing_dp.xl, gap: tokens.spacing_dp.lg },
  segments: { flexDirection: 'row', gap: tokens.spacing_dp.xs },
  segment: { flex: 1, minHeight: tokens.touch.minTarget_dp, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius_dp.md },
  selected: { backgroundColor: tokens.color.primaryLight },
  languageGroup: { gap: tokens.spacing_dp.sm },
  languageChoice: { minHeight: tokens.touch.minTarget_dp, justifyContent: 'center', padding: tokens.spacing_dp.md, borderWidth: tokens.elevation_dp.subtle, borderColor: tokens.color.border, borderRadius: tokens.radius_dp.md },
  navigation: { flexDirection: 'row', borderTopWidth: tokens.elevation_dp.subtle, borderColor: tokens.color.border },
  tab: { flex: 1, minHeight: tokens.touch.minTarget_dp, alignItems: 'center', justifyContent: 'center', padding: tokens.spacing_dp.sm },
  tabSymbol: { width: tokens.spacing_dp.xl, height: tokens.spacing_dp.xl },
  title: { fontSize: tokens.typography_sp.H3.size, color: tokens.color.textPrimary },
  text: { fontSize: tokens.typography_sp.bodySmall.size, color: tokens.color.textPrimary, textAlign: 'center' },
});
