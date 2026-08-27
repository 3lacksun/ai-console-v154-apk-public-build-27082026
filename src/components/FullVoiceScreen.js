import React, { useMemo } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconClose, IconMic, IconStop } from './Icons';
import { FullVoiceState } from '../voice/fullVoiceMode.mjs';
import { radii } from '../theme';
import { useModalAccessibilityFocus, useReducedMotion } from '../ui/primitives';

const stateCopy = (state) => ({
  REQUESTING_PERMISSION: 'REQUESTING PERMISSION', LISTENING: 'LISTENING', FINALIZING_STT: 'FINALISING',
  READY_TO_SEND: 'READY TO SEND', GENERATING: 'GENERATING', SPEAKING: 'SPEAKING', INTERRUPTING: 'INTERRUPTING',
  STOPPED: 'STOPPED', PERMISSION_DENIED: 'PERMISSION DENIED', STT_ERROR: 'SPEECH ERROR', GENERATION_ERROR: 'GENERATION ERROR', TTS_ERROR: 'PLAYBACK ERROR', IDLE: 'READY',
}[state] || 'READY');

export default function FullVoiceScreen({ visible, session, transcript, onListen, onStopListening, onInterrupt, onStopAll, onReplay, onKeyboard, onControls, onClose, palette, returnFocusRef }) {
  const styles = useMemo(() => createStyles(palette), [palette]);
  const reducedMotion = useReducedMotion();
  const titleRef = useModalAccessibilityFocus(visible, returnFocusRef);
  const state = session?.state || FullVoiceState.IDLE;
  const listening = state === FullVoiceState.LISTENING;
  const speaking = state === FullVoiceState.SPEAKING;
  const generating = state === FullVoiceState.GENERATING;
  const requesting = state === FullVoiceState.REQUESTING_PERMISSION;
  const canListen = !requesting && !listening && !generating && !speaking && state !== FullVoiceState.INTERRUPTING;
  const response = String(session?.lastResponse || '').trim();
  const shownTranscript = String(transcript || session?.lastTranscript || '').trim();
  return <Modal visible={visible} transparent={false} presentationStyle="fullScreen" animationType={reducedMotion ? 'none' : 'slide'} onRequestClose={onClose}>
    <View style={styles.root} accessibilityViewIsModal>
      <View style={styles.header}>
        <View style={styles.headerCopy}><Text ref={titleRef} accessible accessibilityRole="header" style={styles.eyebrow}>DR STONES // FULL VOICE</Text><Text style={styles.title}>Conversational command</Text></View>
        <TouchableOpacity style={styles.iconButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close Full Voice Mode"><IconClose color={palette.textMuted} /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.stateCard} accessibilityLiveRegion="polite"><Text style={styles.stateLabel}>{stateCopy(state)}</Text><Text style={styles.stateHint}>{session?.autoListenPending ? 'Listening will resume automatically…' : session?.error || (listening ? 'Speak naturally. Your final utterance will use the active chat.' : speaking ? 'You can interrupt playback at any time.' : generating ? 'The active chat is generating your response.' : 'Tap Listen to begin a voice turn.')}</Text></View>
        <View style={styles.activity} accessible accessibilityLabel={listening ? 'Microphone active' : speaking ? 'Assistant speech active' : 'Voice activity idle'}><View style={styles.activityDot}/><View style={[styles.activityDot, styles.activityDotTall]}/><View style={styles.activityDot}/></View>
        <View style={styles.card}><Text style={styles.cardLabel}>YOU</Text><Text selectable style={styles.cardText}>{shownTranscript || 'Your transcript will appear here.'}</Text></View>
        <View style={styles.card}><Text style={styles.cardLabel}>ASSISTANT</Text><Text selectable style={styles.cardText}>{response || 'The spoken response will appear here after generation.'}</Text></View>
        <View style={styles.primaryActions}>
          {listening ? <TouchableOpacity style={styles.primaryButton} onPress={onStopListening} accessibilityRole="button" accessibilityLabel="Stop listening and finalise transcript"><IconStop /><Text style={styles.primaryText}>Stop listening</Text></TouchableOpacity> : speaking ? <TouchableOpacity style={styles.primaryButton} onPress={onInterrupt} accessibilityRole="button" accessibilityLabel="Interrupt speech and start listening"><IconMic size={18} color="#fff"/><Text style={styles.primaryText}>Interrupt</Text></TouchableOpacity> : generating ? <TouchableOpacity style={styles.primaryButton} onPress={onStopAll} accessibilityRole="button" accessibilityLabel="Stop voice generation"><IconStop /><Text style={styles.primaryText}>Stop generation</Text></TouchableOpacity> : <TouchableOpacity style={[styles.primaryButton, !canListen && styles.disabled]} onPress={onListen} disabled={!canListen} accessibilityRole="button" accessibilityLabel="Start listening"><IconMic size={18} color="#fff"/><Text style={styles.primaryText}>{requesting ? 'Requesting…' : 'Listen'}</Text></TouchableOpacity>}
          <TouchableOpacity style={styles.secondaryButton} onPress={onStopAll} accessibilityRole="button" accessibilityLabel="Stop Full Voice session"><Text style={styles.secondaryText}>Stop</Text></TouchableOpacity>
        </View>
        <View style={styles.utilityRow}>
          <TouchableOpacity style={styles.utilityButton} onPress={onKeyboard} accessibilityRole="button" accessibilityLabel="Use keyboard in this chat"><Text style={styles.utilityText}>Keyboard</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.utilityButton, !response && styles.disabled]} onPress={onReplay} disabled={!response} accessibilityRole="button" accessibilityLabel="Replay last assistant response"><Text style={styles.utilityText}>Replay</Text></TouchableOpacity>
          <TouchableOpacity style={styles.utilityButton} onPress={onControls} accessibilityRole="button" accessibilityLabel="Open Full Voice controls"><Text style={styles.utilityText}>Controls</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  </Modal>;
}

const createStyles = (colors) => StyleSheet.create({
  root:{flex:1,backgroundColor:colors.bg}, header:{minHeight:76,paddingHorizontal:16,paddingVertical:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:colors.border,backgroundColor:colors.bgHeader}, headerCopy:{flex:1,minWidth:0}, eyebrow:{color:colors.cyanBright,fontSize:10,fontWeight:'900',letterSpacing:1.1}, title:{color:colors.textPrimary,fontSize:20,fontWeight:'800',marginTop:4}, iconButton:{width:48,height:48,alignItems:'center',justifyContent:'center',borderRadius:radii.md,backgroundColor:colors.panel}, content:{padding:16,paddingBottom:40,gap:14}, stateCard:{padding:16,borderRadius:radii.lg,backgroundColor:colors.surfaceElevated,borderWidth:1,borderColor:colors.cyanBorder}, stateLabel:{color:colors.textPrimary,fontSize:22,fontWeight:'900',letterSpacing:.5}, stateHint:{color:colors.textMuted,fontSize:12,lineHeight:18,marginTop:6}, activity:{height:80,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8}, activityDot:{width:10,height:28,borderRadius:8,backgroundColor:colors.cyan}, activityDotTall:{height:50}, card:{minHeight:110,padding:14,borderWidth:1,borderColor:colors.border,borderRadius:radii.lg,backgroundColor:colors.panelAlt}, cardLabel:{color:colors.cyanBright,fontSize:10,fontWeight:'900',letterSpacing:1}, cardText:{color:colors.textSecondary,fontSize:15,lineHeight:22,marginTop:8}, primaryActions:{flexDirection:'row',gap:10}, primaryButton:{flex:1,minHeight:52,paddingHorizontal:16,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,borderRadius:radii.lg,backgroundColor:colors.cyan}, primaryText:{color:'#fff',fontSize:13,fontWeight:'900'}, secondaryButton:{minWidth:92,minHeight:52,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.border,borderRadius:radii.lg,backgroundColor:colors.panel}, secondaryText:{color:colors.rose,fontWeight:'900'}, utilityRow:{flexDirection:'row',gap:8}, utilityButton:{flex:1,minHeight:48,alignItems:'center',justifyContent:'center',borderRadius:radii.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surfaceElevated}, utilityText:{color:colors.textSecondary,fontSize:11,fontWeight:'800'}, disabled:{opacity:.45}
});
