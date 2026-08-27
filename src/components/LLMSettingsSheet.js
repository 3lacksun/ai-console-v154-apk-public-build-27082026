import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, StyleSheet, ActivityIndicator, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import { IconKey, IconServer, IconRefresh, IconClose } from './Icons';
import { radii } from '../theme';
import { useModalAccessibilityFocus, useReducedMotion } from '../ui/primitives';
import { DEFAULT_SYSTEM_PROMPT } from '../utils/storage';
import { MAX_OUTPUT_TOKENS, MIN_OUTPUT_TOKENS, normaliseOutputTokens } from '../utils/outputTokens.mjs';

const PROMPT_PRESETS = [
  { label: 'Structured', value: DEFAULT_SYSTEM_PROMPT },
  { label: 'Data Analyst', value: 'You are an expert data analyst. Present complex comparisons using clear Markdown tables based on objective facts.' },
  { label: 'General', value: 'You are a helpful, accurate, and highly capable AI assistant.' },
];

export default function LLMSettingsSheet({
  visible, onClose, activeProvider = 'openrouter', onChangeProvider = () => {}, apiKey, onChangeApiKey, togetherApiKey = '', onChangeTogetherApiKey = () => {}, currentModelName, onOpenModelPicker,
  imageModelName = 'Not selected', onOpenImageModelPicker = () => {}, isFetchingImageModels = false, onSyncImageModels = () => {},
  systemPrompt, onChangeSystemPrompt, temperature, onChangeTemperature, maxTokens,
  onChangeMaxTokens, isFetchingModels, onSyncModels, appLockEnabled = false, onToggleAppLock = () => {}, appLockStatusText = 'Device lock is off.', onOpenProtectedWorkspaceTools = () => {}, apiKeyPersistenceStatus = 'UNKNOWN', togetherApiKeyPersistenceStatus = 'UNKNOWN', palette, returnFocusRef,
}) {
  const styles = useMemo(() => createStyles(palette), [palette]);
  const reducedMotion = useReducedMotion();
  const modalTitleRef = useModalAccessibilityFocus(visible, returnFocusRef);
  const [showKey, setShowKey] = useState(false);
  const [showTogetherKey, setShowTogetherKey] = useState(false);
  const [tokenDraft, setTokenDraft] = useState(String(maxTokens));
  useEffect(() => { setTokenDraft(String(maxTokens)); }, [maxTokens]);
  const commitTokenDraft = () => { const next = normaliseOutputTokens(tokenDraft, maxTokens); onChangeMaxTokens(next); setTokenDraft(String(next)); };
  return (
    <Modal visible={visible} animationType={reducedMotion ? 'none' : 'slide'} transparent={false} statusBarTranslucent={false} navigationBarTranslucent={false} presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} accessibilityLabel="Lock and close AI settings" accessibilityRole="button" />
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.header}>
            <View style={styles.titleRow}><IconKey color={palette.cyanBright} /><Text ref={modalTitleRef} accessible accessibilityRole="header" style={styles.headerTitle}>Protected AI & Prompt Settings</Text></View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Lock and close AI settings" accessibilityRole="button"><IconClose size={18} color={palette.textMuted} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.securityNote}>Protected settings can use your device biometric or screen lock. No app PIN is stored. When enabled, the app relocks after six hours.</Text>
            <View style={styles.section}>
              <View style={styles.labelRow}><IconServer color={palette.textMuted} /><Text style={styles.label}>Active provider</Text></View>
              <View style={styles.providerRow}>
                {[['openrouter','OpenRouter'],['together','Together AI']].map(([id,label]) => { const active = activeProvider === id; return <TouchableOpacity key={id} accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={`Use ${label} for new AI requests`} onPress={() => onChangeProvider(id)} style={[styles.providerChoice, active && styles.providerChoiceActive]}><Text style={[styles.providerChoiceText, active && styles.providerChoiceTextActive]}>{label}</Text></TouchableOpacity>; })}
              </View>
              <Text style={styles.hint}>Provider selection applies to new Chat, Full Voice, Skill and Task requests. The app never falls back to the other provider automatically.</Text>
            </View>

            <View style={styles.section}>
              <View style={styles.labelRow}><IconKey color={palette.textMuted} /><Text style={styles.label}>OpenRouter API Key</Text></View>
              <TextInput value={apiKey} onChangeText={onChangeApiKey} placeholder="sk-or-v1-..." placeholderTextColor={palette.textFaint} secureTextEntry={!showKey} autoCapitalize="none" autoCorrect={false} style={styles.input} accessibilityLabel="OpenRouter API key" /><Text style={styles.persistenceStatus} accessibilityLiveRegion="polite">{apiKeyPersistenceStatus === 'SAVED_SECURELY' ? 'Saved securely' : apiKeyPersistenceStatus === 'SESSION_ONLY' ? 'Session only — SecureStore persistence failed' : apiKeyPersistenceStatus === 'READ_FAILED' ? 'Secure storage read failed — existing key was not modified' : apiKeyPersistenceStatus === 'READ_OK' ? 'Secure storage read successfully' : 'Secure persistence not yet verified this session'}</Text>
              <TouchableOpacity onPress={() => setShowKey((value) => !value)} style={styles.textAction} accessibilityRole="button"><Text style={styles.toggleText}>{showKey ? 'Hide key' : 'Show key'}</Text></TouchableOpacity>
            </View>

            <View style={styles.section}>
              <View style={styles.labelRow}><IconKey color={palette.textMuted} /><Text style={styles.label}>Together AI API Key</Text></View>
              <TextInput value={togetherApiKey} onChangeText={onChangeTogetherApiKey} placeholder="Together API key" placeholderTextColor={palette.textFaint} secureTextEntry={!showTogetherKey} autoCapitalize="none" autoCorrect={false} style={styles.input} accessibilityLabel="Together AI API key" /><Text style={styles.persistenceStatus} accessibilityLiveRegion="polite">{togetherApiKeyPersistenceStatus === 'SAVED_SECURELY' ? 'Saved securely' : togetherApiKeyPersistenceStatus === 'SESSION_ONLY' ? 'Session only — SecureStore persistence failed' : togetherApiKeyPersistenceStatus === 'READ_FAILED' ? 'Secure storage read failed — existing key was not modified' : togetherApiKeyPersistenceStatus === 'READ_OK' ? 'Secure storage read successfully' : 'Secure persistence not yet verified this session'}</Text>
              <TouchableOpacity onPress={() => setShowTogetherKey((value) => !value)} style={styles.textAction} accessibilityRole="button"><Text style={styles.toggleText}>{showTogetherKey ? 'Hide key' : 'Show key'}</Text></TouchableOpacity>
              <Text style={styles.hint}>Paste your Together API key from its project settings. A pasted `Bearer ` or `Authorization: Bearer ` prefix is removed automatically. Provider credentials are stored independently in device-backed SecureStore and excluded from ordinary exports/backups.</Text>
            </View>

            <View style={styles.section}>
              <View style={styles.labelRowBetween}>
                <View style={styles.labelRow}><IconServer color={palette.textMuted} /><Text style={styles.label}>{activeProvider === 'together' ? 'Together AI model' : 'OpenRouter model'}</Text></View>
                <TouchableOpacity onPress={onSyncModels} disabled={isFetchingModels} style={styles.syncBtn} accessibilityLabel="Sync models" accessibilityRole="button">
                  {isFetchingModels ? <ActivityIndicator size="small" color={palette.cyanBright} /> : <IconRefresh color={palette.cyanBright} />}
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.selectBtn} onPress={onOpenModelPicker} accessibilityRole="button"><Text style={styles.selectBtnText} numberOfLines={1}>{currentModelName}</Text></TouchableOpacity>
            </View>

            <View style={styles.section}>
              <View style={styles.labelRowBetween}>
                <View style={styles.labelRow}><IconServer color={palette.textMuted} /><Text style={styles.label}>OpenRouter image model</Text></View>
                <TouchableOpacity onPress={onSyncImageModels} disabled={isFetchingImageModels} style={styles.syncBtn} accessibilityLabel="Sync OpenRouter image models" accessibilityRole="button">
                  {isFetchingImageModels ? <ActivityIndicator size="small" color={palette.cyanBright} /> : <IconRefresh color={palette.cyanBright} />}
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.selectBtn} onPress={onOpenImageModelPicker} accessibilityRole="button" accessibilityLabel="Choose OpenRouter image model"><Text style={styles.selectBtnText} numberOfLines={1}>{imageModelName}</Text></TouchableOpacity>
              <Text style={styles.hint}>Create image uses OpenRouter's dedicated image API. The image model is stored separately from the active text model, so selecting Together AI for Chat does not silently switch your text provider.</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Prompt System / Assistant Instructions</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetRow}>
                {PROMPT_PRESETS.map((preset) => {
                  const active = systemPrompt === preset.value;
                  return <TouchableOpacity accessibilityRole="button" key={preset.label} onPress={() => onChangeSystemPrompt(preset.value)} style={[styles.presetChip, active && styles.presetChipActive]}><Text style={[styles.presetChipText, active && styles.presetChipTextActive]}>{preset.label}</Text></TouchableOpacity>;
                })}
              </ScrollView>
              <TextInput value={systemPrompt} onChangeText={onChangeSystemPrompt} multiline textAlignVertical="top" style={styles.promptInput} accessibilityLabel="System prompt" />
            </View>

            <View style={styles.sliderPanel}>
              <View style={styles.sliderBlock}>
                <View style={styles.sliderLabelRow}><Text style={styles.sliderLabel}>Temperature</Text><Text style={styles.sliderValue}>{Number(temperature).toFixed(1)}</Text></View>
                <Slider minimumValue={0} maximumValue={1} step={0.1} value={Number(temperature)} onValueChange={onChangeTemperature} minimumTrackTintColor={palette.cyan} maximumTrackTintColor={palette.border} thumbTintColor={palette.cyanBright} accessibilityLabel="Temperature" />
              </View>
              <View style={styles.sliderBlock}>
                <View style={styles.sliderLabelRow}><Text style={styles.sliderLabel}>Max Tokens</Text><Text style={styles.sliderValue}>{Number(maxTokens).toLocaleString()}</Text></View>
                <Slider minimumValue={MIN_OUTPUT_TOKENS} maximumValue={MAX_OUTPUT_TOKENS} step={MIN_OUTPUT_TOKENS} value={normaliseOutputTokens(maxTokens)} onValueChange={(value) => onChangeMaxTokens(normaliseOutputTokens(value))} minimumTrackTintColor={palette.cyan} maximumTrackTintColor={palette.border} thumbTintColor={palette.cyanBright} accessibilityLabel="Maximum output tokens" />
                <TextInput value={tokenDraft} onChangeText={setTokenDraft} onBlur={commitTokenDraft} onSubmitEditing={commitTokenDraft} keyboardType="number-pad" returnKeyType="done" placeholder="Exact output-token limit" placeholderTextColor={palette.textFaint} style={styles.tokenInput} accessibilityLabel="Exact maximum output tokens" accessibilityHint={`Enter between ${MIN_OUTPUT_TOKENS} and ${MAX_OUTPUT_TOKENS} output tokens`} />
                <Text style={styles.tokenHint}>Large-model ceiling: up to {MAX_OUTPUT_TOKENS.toLocaleString()} tokens. Providers may enforce lower per-model limits.</Text>
              </View>
            </View>

            <View style={styles.appLockRow}><View style={styles.appLockCopy}><Text style={styles.appLockTitle}>Device biometric / screen-lock gate</Text><Text style={styles.appLockDetail}>{appLockStatusText}</Text></View><Switch value={appLockEnabled} onValueChange={onToggleAppLock} accessibilityLabel="Toggle device biometric and screen-lock gate" /></View>
            <TouchableOpacity style={styles.changePinBtn} onPress={onOpenProtectedWorkspaceTools} accessibilityRole="button"><Text style={styles.changePinText}>Manage Prompt Library & Project AI Configuration</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.bg, justifyContent: 'flex-end' },
  sheet: { height: '90%', backgroundColor: colors.bg, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  closeBtn: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel, borderRadius: radii.sm },
  body: { padding: 16, paddingBottom: 40, gap: 24 },
  securityNote: { padding: 12, fontSize: 12, lineHeight: 18, color: colors.textMuted, backgroundColor: colors.cyanDim, borderWidth: 1, borderColor: colors.cyanBorder, borderRadius: radii.md },
  section: { gap: 8 },
  providerRow: { flexDirection: 'row', gap: 8 },
  providerChoice: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, backgroundColor: colors.panel },
  providerChoiceActive: { borderColor: colors.cyanBright, backgroundColor: colors.cyanDim },
  providerChoiceText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  providerChoiceTextActive: { color: colors.cyanBright },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  labelRowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  input: { minHeight: 48, padding: 12, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, color: colors.textSecondary, fontSize: 14 },
  textAction: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center' },
  toggleText: { fontSize: 11, color: colors.cyanBright, fontWeight: '700' },
  hint: { fontSize: 11, color: colors.textFaint },
  syncBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md },
  selectBtn: { minHeight: 48, padding: 12, justifyContent: 'center', backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md },
  selectBtnText: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  presetRow: { flexDirection: 'row', marginBottom: 4 },
  presetChip: { minHeight: 44, justifyContent: 'center', marginRight: 8, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.md, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  presetChipActive: { backgroundColor: colors.cyanDim, borderColor: colors.cyanBorder },
  presetChipText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  presetChipTextActive: { color: colors.cyanBright },
  promptInput: { padding: 12, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, color: colors.textSecondary, fontSize: 13, minHeight: 112 },
  sliderPanel: { gap: 18, padding: 14, borderRadius: radii.md, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  sliderBlock: { gap: 4 },
  sliderLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sliderLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  sliderValue: { fontSize: 11, fontWeight: '700', color: colors.cyanBright }, tokenInput: { minHeight: 48, marginTop: 6, paddingHorizontal: 12, color: colors.textSecondary, backgroundColor: colors.panelAlt, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, fontSize: 14 }, tokenHint: { color: colors.textFaint, fontSize: 10, lineHeight: 14 },
  appLockRow: { minHeight: 76, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderRadius: radii.md, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  appLockCopy: { flex: 1 }, appLockTitle: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' }, appLockDetail: { marginTop: 4, color: colors.textFaint, fontSize: 10, lineHeight: 15 },
  changePinBtn: { minHeight: 48, alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: radii.md, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.borderLight },
  changePinText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' }, persistenceStatus: { color: colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 5 },
});
