import React, { useMemo } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { IconClose, IconDownload, IconTrash } from './Icons';
import { radii } from '../theme';
import { useModalAccessibilityFocus, useReducedMotion } from '../ui/primitives';

const Section = ({ title, children, styles }) => <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
const Action = ({ label, onPress, styles, icon = null, primary = false, danger = false, disabled = false, accessibilityLabel }) => <TouchableOpacity disabled={disabled} style={[styles.action, primary && styles.primaryAction, danger && styles.dangerAction, disabled && styles.actionDisabled]} onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel || label} accessibilityState={{ disabled }}>{icon}<Text style={[styles.actionText, primary && styles.primaryActionText, danger && styles.dangerText]}>{label}</Text></TouchableOpacity>;

export default function SettingsSheet({ visible, onClose, onExportChat, onExportPdf = () => {}, onExportPdfCompact = () => {}, onCreateDocumentZip = () => {}, onClearChat, onExportData = () => {}, onImportData = () => {}, onBackup = () => {}, onRestore = () => {}, dataStats = {}, colorMode, onToggleColorMode, voiceLocale = 'en-GB', onChangeVoiceLocale = () => {}, playbackSpeed = 1, onChangePlaybackSpeed = () => {}, onStopSpeech = () => {}, togetherSonicVoice = '', togetherSonicVoices = [], onChangeTogetherSonicVoice = () => {}, onRefreshTogetherSonicVoices = () => {}, onClearTogetherSonicCache = () => {}, isRefreshingTogetherSonicVoices = false, togetherSonicConfigured = false, hapticsEnabled = true, onToggleHaptics = () => {}, palette, returnFocusRef }) {
  const styles = useMemo(() => createStyles(palette), [palette]);
  const reducedMotion = useReducedMotion();
  const modalTitleRef = useModalAccessibilityFocus(visible, returnFocusRef);
  const voices = togetherSonicVoices.length ? togetherSonicVoices : [{ id: togetherSonicVoice || 'friendly sidekick', name: togetherSonicVoice || 'friendly sidekick' }];
  return <Modal visible={visible} animationType={reducedMotion ? 'none' : 'slide'} transparent={false} statusBarTranslucent={false} navigationBarTranslucent={false} presentationStyle="fullScreen" onRequestClose={onClose}>
    <View style={styles.backdrop}><View style={styles.sheet} accessibilityViewIsModal>
      <View style={styles.header}><View><Text ref={modalTitleRef} accessible accessibilityRole="header" style={styles.title}>App Settings</Text><Text style={styles.headerDetail}>Device, voice, local data and export controls</Text></View><TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close app settings"><IconClose color={palette.textMuted} /></TouchableOpacity></View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Section title="General" styles={styles}>
          <View style={styles.row}><View style={styles.rowCopy}><Text style={styles.rowTitle}>Appearance</Text><Text style={styles.rowDetail}>Light theme</Text></View><Text style={styles.valueText}>On</Text></View>
          <View style={styles.row}><View style={styles.rowCopy}><Text style={styles.rowTitle}>Speech locale</Text><Text style={styles.rowDetail}>{voiceLocale}</Text></View><TouchableOpacity style={styles.smallButton} onPress={() => onChangeVoiceLocale(voiceLocale === 'en-GB' ? 'en-US' : 'en-GB')} accessibilityRole="button"><Text style={styles.smallButtonText}>Change</Text></TouchableOpacity></View>
          <View style={styles.row}><View style={styles.rowCopy}><Text style={styles.rowTitle}>Haptic feedback</Text><Text style={styles.rowDetail}>Navigation and confirmations</Text></View><Switch value={hapticsEnabled} onValueChange={onToggleHaptics} accessibilityLabel="Toggle haptic feedback" /></View>
        </Section>

        <Section title="Voice" styles={styles}>
          <View style={styles.row}><View style={styles.rowCopy}><Text style={styles.rowTitle}>Playback speed</Text><Text style={styles.rowDetail}>{Number(playbackSpeed).toFixed(1)}× device speech</Text></View><TouchableOpacity style={styles.smallButton} onPress={() => onChangePlaybackSpeed(playbackSpeed >= 1.5 ? 0.8 : Number((playbackSpeed + 0.1).toFixed(1)))} accessibilityRole="button"><Text style={styles.smallButtonText}>Change</Text></TouchableOpacity></View>
          <View style={styles.voicePanel}><Text style={styles.rowTitle}>Together Sonic voice</Text><View style={styles.pickerFrame}><Picker selectedValue={togetherSonicVoice} enabled={togetherSonicConfigured && !isRefreshingTogetherSonicVoices} onValueChange={(value) => onChangeTogetherSonicVoice(String(value))} style={styles.voicePicker} dropdownIconColor={palette.cyanBright} accessibilityLabel="Together Sonic voice selection">{voices.map((voice) => <Picker.Item key={voice.id} label={voice.name} value={voice.id} color={palette.textPrimary} />)}</Picker></View><TouchableOpacity disabled={!togetherSonicConfigured || isRefreshingTogetherSonicVoices} style={[styles.smallButtonWide, (!togetherSonicConfigured || isRefreshingTogetherSonicVoices) && styles.actionDisabled]} onPress={onRefreshTogetherSonicVoices} accessibilityRole="button" accessibilityLabel="Refresh Together Sonic voice options">{isRefreshingTogetherSonicVoices ? <ActivityIndicator color={palette.cyanBright} /> : <Text style={styles.smallButtonText}>Refresh voices</Text>}</TouchableOpacity>{!togetherSonicConfigured && <Text style={styles.inlineHint}>Configure a Together AI key in AI & Prompt Settings to load Sonic voices.</Text>}</View>
          <Action label="Stop text to speech" onPress={onStopSpeech} styles={styles} icon={<Text style={styles.actionGlyph}>■</Text>} />
          <Action label="Clear temporary Sonic audio cache" onPress={onClearTogetherSonicCache} styles={styles} icon={<IconTrash size={17} color={palette.textMuted} />} />
        </Section>

        <Section title="Current data" styles={styles}>
          <View style={styles.statsCard}><Text style={styles.statsText}>Schema {dataStats.schema || '—'} · {dataStats.chats || 0} chats · {dataStats.archived || 0} archived · {dataStats.attachments || 0} attachments · {dataStats.queued || 0} queued</Text><Text style={styles.inlineHint}>Secrets and transient request context are excluded from ordinary exports and backups.</Text></View>
        </Section>

        <Section title="Export & transfer" styles={styles}>
          <Action label="Export current chat as text" onPress={onExportChat} styles={styles} icon={<IconDownload size={17} color={palette.cyanBright} />} />
          <Action label="Create current chat as local PDF" onPress={onExportPdf} styles={styles} primary icon={<IconDownload size={17} color="#ffffff" />} />
          <Action label="Create compact transcript PDF" onPress={onExportPdfCompact} styles={styles} icon={<IconDownload size={17} color={palette.cyanBright} />} />
          <Action label="Create safe document ZIP bundle" onPress={onCreateDocumentZip} styles={styles} icon={<Text style={styles.actionGlyph}>▣</Text>} />
          <Action label="Export current chat as safe JSON" onPress={onExportData} styles={styles} icon={<IconDownload size={17} color={palette.cyanBright} />} />
          <Action label="Import validated chat JSON" onPress={onImportData} styles={styles} icon={<Text style={styles.actionGlyph}>⇩</Text>} />
          <Action label="Create validated ordinary backup" onPress={onBackup} styles={styles} icon={<Text style={styles.actionGlyph}>⇧</Text>} />
          <Action label="Preview and restore validated backup" onPress={onRestore} styles={styles} icon={<Text style={styles.actionGlyph}>⇩</Text>} />
        </Section>

        <Section title="Destructive" styles={styles}><Action label="Clear current chat" onPress={onClearChat} styles={styles} danger icon={<IconTrash size={17} color={palette.rose} />} /></Section>
      </ScrollView>
    </View></View>
  </Modal>;
}

const createStyles = (colors) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.bg },
  sheet: { flex: 1, backgroundColor: colors.bg },
  header: { minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.textPrimary, fontSize: 17, fontWeight: '800' },
  headerDetail: { color: colors.textFaint, fontSize: 10, marginTop: 2 },
  closeBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 16, paddingBottom: 40, gap: 20 },
  section: { gap: 8 },
  sectionTitle: { color: colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 2 },
  row: { minHeight: 58, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md },
  rowCopy: { flex: 1 },
  rowTitle: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  rowDetail: { color: colors.textFaint, fontSize: 10, marginTop: 2 },
  valueText: { color: colors.cyanBright, fontWeight: '700', fontSize: 11 },
  smallButton: { minHeight: 48, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyanDim, borderRadius: radii.sm },
  smallButtonWide: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.cyanBorder, borderRadius: radii.sm, backgroundColor: colors.cyanDim },
  smallButtonText: { color: colors.cyanBright, fontWeight: '700', fontSize: 11 },
  voicePanel: { padding: 12, gap: 8, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md },
  pickerFrame: { minHeight: 52, justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: colors.borderLight, borderRadius: radii.sm, backgroundColor: colors.panelAlt },
  voicePicker: { minHeight: 52, color: colors.textPrimary },
  inlineHint: { color: colors.textFaint, fontSize: 10, lineHeight: 15 },
  statsCard: { padding: 12, gap: 4, backgroundColor: colors.panelAlt, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md },
  statsText: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', lineHeight: 17 },
  action: { minHeight: 50, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel, borderRadius: radii.md },
  actionDisabled: { opacity: 0.5 },
  actionText: { flex: 1, color: colors.textSecondary, fontSize: 12, fontWeight: '650' },
  primaryAction: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  primaryActionText: { color: '#ffffff' },
  dangerAction: { borderColor: colors.rose },
  dangerText: { color: colors.rose },
  actionGlyph: { color: colors.cyanBright, fontSize: 18 },
});