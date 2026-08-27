import { SETTINGS_PIN_LENGTH, normaliseSettingsPin } from './settingsPolicy.mjs';

export function appendPinDigit(value, digit) {
  const cleanDigit = String(digit).replace(/\D/g, '').slice(0, 1);
  if (!cleanDigit) return normaliseSettingsPin(value);
  return normaliseSettingsPin(`${normaliseSettingsPin(value)}${cleanDigit}`).slice(0, SETTINGS_PIN_LENGTH);
}

export function removePinDigit(value) {
  return normaliseSettingsPin(value).slice(0, -1);
}

export function clearPinDigits() {
  return '';
}
