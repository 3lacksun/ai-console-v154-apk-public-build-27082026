import test from 'node:test';
import assert from 'node:assert/strict';
import { appendPinDigit, clearPinDigits, removePinDigit } from '../src/utils/pinKeypad.mjs';

test('PIN keypad accepts only one numeric digit per press and caps input at six digits', () => {
  let pin = '';
  for (const digit of ['1', '2', '3', '4', '5', '6', '7']) pin = appendPinDigit(pin, digit);
  assert.equal(pin, '123456');
  assert.equal(appendPinDigit('12345', 'x'), '12345');
  assert.equal(appendPinDigit('12345', '98'), '123459');
});

test('PIN keypad deletion and clear preserve the normalised PIN value', () => {
  assert.equal(removePinDigit('12a345'), '1234');
  assert.equal(removePinDigit(''), '');
  assert.equal(clearPinDigits(), '');
});
