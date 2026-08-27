import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconClose, IconKey } from './Icons';
import { radii } from '../theme';
import { useModalAccessibilityFocus, useReducedMotion } from '../ui/primitives';
import { isValidSettingsPin } from '../utils/settingsPolicy.mjs';
import { appendPinDigit, clearPinDigits, removePinDigit } from '../utils/pinKeypad.mjs';

const PIN_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

function PinValue({ label, value, active, onPress, palette, disabled = false }) {
  const masked = value ? '•'.repeat(value.length) : '••••••';
  return (
    <TouchableOpacity
      style={[styles.pinValue, active && styles.pinValueActive]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      accessibilityLabel={label}
      accessibilityHint={disabled ? undefined : 'Select this PIN field for keypad entry'}
    >
      <Text style={[styles.pinValueText, !value && { color: palette.textFaint }]}>{masked}</Text>
    </TouchableOpacity>
  );
}

export default function PinGateModal({ visible, mode = 'unlock', onClose, onSubmit, palette, returnFocusRef }) {
  const componentStyles = useMemo(() => createStyles(palette), [palette]);
  const reducedMotion = useReducedMotion();
  const modalTitleRef = useModalAccessibilityFocus(visible, returnFocusRef);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [activeField, setActiveField] = useState('pin');
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [clock, setClock] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const creating = mode === 'create' || mode === 'change';

  useEffect(() => {
    if (visible) {
      setPin('');
      setConfirmPin('');
      setActiveField('pin');
      setError('');
      setFailedAttempts(0);
      setLockedUntil(0);
      setSubmitting(false);
    }
  }, [visible, mode]);

  useEffect(() => {
    if (!visible || lockedUntil <= Date.now()) return undefined;
    const timer = setInterval(() => setClock(Date.now()), 250);
    return () => clearInterval(timer);
  }, [visible, lockedUntil]);

  const remainingSeconds = Math.max(0, Math.ceil((lockedUntil - clock) / 1000));
  const activeValue = activeField === 'confirm' ? confirmPin : pin;

  const updateActivePin = (transform) => {
    if (submitting || remainingSeconds > 0) return;
    const next = transform(activeValue);
    if (activeField === 'confirm') setConfirmPin(next);
    else setPin(next);
    if (error) setError('');
  };

  const enterDigit = (digit) => {
    const next = appendPinDigit(activeValue, digit);
    updateActivePin(() => next);
    if (creating && activeField === 'pin' && next.length === 6) setActiveField('confirm');
  };

  const submit = async () => {
    if (submitting) return;
    if (lockedUntil > Date.now()) {
      setError(`Try again in ${Math.ceil((lockedUntil - Date.now()) / 1000)} seconds.`);
      return;
    }
    if (!isValidSettingsPin(pin)) {
      setError('Enter exactly 6 digits.');
      setActiveField('pin');
      return;
    }
    if (creating && pin !== confirmPin) {
      setError('PIN confirmation does not match.');
      setActiveField('confirm');
      return;
    }
    setSubmitting(true);
    try {
      const result = await Promise.resolve(onSubmit?.(pin));
      if (typeof result === 'string' && result) {
        const next = failedAttempts + 1;
        setFailedAttempts(next);
        if (mode === 'unlock') {
          const delay = Math.min(30000, Math.max(1000, 1000 * (2 ** Math.max(0, next - 2))));
          setLockedUntil(Date.now() + delay);
          setClock(Date.now());
        }
        setError(result);
      } else {
        setFailedAttempts(0);
        setLockedUntil(0);
      }
    } catch (submitError) {
      setError(submitError?.message || 'PIN verification could not be completed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === 'unlock' ? 'Unlock AI Settings' : mode === 'change' ? 'Change AI Settings PIN' : 'Create AI Settings PIN';
  const fieldDisabled = submitting || remainingSeconds > 0;

  return (
    <Modal visible={visible} transparent={false} statusBarTranslucent={false} navigationBarTranslucent={false} presentationStyle="fullScreen" animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={onClose}>
      <View style={componentStyles.backdrop}>
        <View style={componentStyles.card} accessibilityViewIsModal>
          <View style={componentStyles.header}>
            <View style={componentStyles.titleRow}><IconKey color={palette.cyanBright} /><Text ref={modalTitleRef} accessible accessibilityRole="header" style={componentStyles.title}>{title}</Text></View>
            <TouchableOpacity style={componentStyles.closeBtn} onPress={onClose} disabled={submitting} accessibilityRole="button" accessibilityState={{ disabled: submitting }} accessibilityLabel="Close PIN entry"><IconClose color={palette.textMuted} /></TouchableOpacity>
          </View>
          <Text style={componentStyles.help}>{mode === 'unlock' ? 'Use the on-screen keypad to enter the 6-digit PIN for model, provider and prompt settings.' : 'Use the on-screen keypad to create a 6-digit PIN. Only a salted one-way verifier is retained in device-backed SecureStore.'}</Text>
          <View style={componentStyles.fields}>
            <PinValue label="6 digit PIN" value={pin} active={activeField === 'pin'} onPress={() => setActiveField('pin')} palette={palette} disabled={fieldDisabled} />
            {creating && <PinValue label="Confirm 6 digit PIN" value={confirmPin} active={activeField === 'confirm'} onPress={() => setActiveField('confirm')} palette={palette} disabled={fieldDisabled} />}
          </View>
          <View style={componentStyles.keypad} accessibilityLabel="PIN keypad">
            {PIN_DIGITS.map((digit) => <TouchableOpacity key={digit} style={componentStyles.key} onPress={() => enterDigit(digit)} disabled={fieldDisabled} accessibilityRole="button" accessibilityLabel={`PIN digit ${digit}`}><Text style={componentStyles.keyText}>{digit}</Text></TouchableOpacity>)}
            <TouchableOpacity style={componentStyles.key} onPress={() => updateActivePin(clearPinDigits)} disabled={fieldDisabled || !activeValue} accessibilityRole="button" accessibilityLabel="Clear PIN digits"><Text style={componentStyles.keyTextSmall}>Clear</Text></TouchableOpacity>
            <TouchableOpacity style={componentStyles.key} onPress={() => enterDigit('0')} disabled={fieldDisabled} accessibilityRole="button" accessibilityLabel="PIN digit 0"><Text style={componentStyles.keyText}>0</Text></TouchableOpacity>
            <TouchableOpacity style={componentStyles.key} onPress={() => updateActivePin(removePinDigit)} disabled={fieldDisabled || !activeValue} accessibilityRole="button" accessibilityLabel="Delete last PIN digit"><Text style={componentStyles.keyTextSmall}>Delete</Text></TouchableOpacity>
          </View>
          {!!error && <Text style={componentStyles.error} accessibilityLiveRegion="polite">{error}</Text>}
          <TouchableOpacity style={componentStyles.submitBtn} onPress={submit} disabled={submitting || remainingSeconds > 0} accessibilityRole="button" accessibilityState={{ disabled: submitting || remainingSeconds > 0 }}><Text style={componentStyles.submitText}>{submitting ? 'Checking PIN…' : remainingSeconds > 0 ? `Try again in ${remainingSeconds}s` : (mode === 'unlock' ? 'Unlock' : 'Save PIN')}</Text></TouchableOpacity>
          <Text style={componentStyles.recovery}>For security there is no unprotected PIN bypass. If the PIN is lost, protected settings can only be reset by clearing the app’s local data or reinstalling.</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pinValue: { minHeight: 52, borderRadius: 10, borderWidth: 1, borderColor: '#44516a', backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  pinValueActive: { borderColor: '#14d9e7', borderWidth: 2 },
  pinValueText: { color: '#f8fafc', fontSize: 22, letterSpacing: 8, textAlign: 'center' },
});

const createStyles = (colors) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 420, backgroundColor: colors.bg, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  closeBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: colors.panel },
  help: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  fields: { gap: 8 },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  key: { width: '30%', minHeight: 48, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  keyText: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  keyTextSmall: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  error: { color: colors.rose, fontSize: 12, fontWeight: '600' },
  submitBtn: { minHeight: 48, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyan },
  submitText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  recovery: { color: colors.textFaint, fontSize: 10, lineHeight: 15 },
});
