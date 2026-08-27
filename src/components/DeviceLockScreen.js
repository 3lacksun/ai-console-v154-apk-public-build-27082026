import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconKey } from './Icons';
import { radii } from '../theme';

export default function DeviceLockScreen({ authenticating = false, error = '', onAuthenticate = () => {}, palette }) {
  const styles = useMemo(() => createStyles(palette), [palette]);
  return <View style={styles.root} testID="device-lock-screen" accessibilityViewIsModal>
    <View style={styles.card}>
      <View style={styles.icon}><IconKey size={24} color={palette.cyanBright} /></View>
      <Text style={styles.eyebrow}>DR STONES // COMMAND CENTRE</Text>
      <Text accessibilityRole="header" style={styles.title}>Unlock with your device</Text>
      <Text style={styles.detail}>Use your enrolled biometric or device screen lock. This app does not use or store a separate unlock code.</Text>
      {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
      <TouchableOpacity disabled={authenticating} onPress={onAuthenticate} style={[styles.unlockButton, authenticating && styles.unlockButtonDisabled]} accessibilityRole="button" accessibilityLabel="Unlock using device biometrics or screen lock" accessibilityState={{ disabled: authenticating }}>
        {authenticating ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.unlockText}>Unlock</Text>}
      </TouchableOpacity>
      <Text style={styles.timeout}>This app relocks after six hours.</Text>
    </View>
  </View>;
}

const createStyles = (colors) => StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg },
  card: { width: '100%', maxWidth: 420, alignItems: 'center', padding: 24, borderWidth: 1, borderColor: colors.border, borderRadius: radii.xl, backgroundColor: colors.panel },
  icon: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: colors.cyanBorder, borderRadius: 18, backgroundColor: colors.cyanDim },
  eyebrow: { color: colors.cyanBright, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { marginTop: 9, color: colors.textPrimary, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  detail: { marginTop: 10, color: colors.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  error: { width: '100%', marginTop: 14, padding: 10, color: colors.rose, fontSize: 11, lineHeight: 16, textAlign: 'center', borderWidth: 1, borderColor: colors.rose, borderRadius: radii.sm, backgroundColor: colors.roseToast },
  unlockButton: { width: '100%', minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 20, paddingHorizontal: 16, borderRadius: radii.md, backgroundColor: colors.cyan },
  unlockButtonDisabled: { opacity: 0.7 },
  unlockText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  timeout: { marginTop: 13, color: colors.textFaint, fontSize: 10, textAlign: 'center' },
});
