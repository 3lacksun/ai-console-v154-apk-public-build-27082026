import test from 'node:test';
import assert from 'node:assert/strict';
import { createPinVerifier, createPinVerifierAsync, pbkdf2Sha256, pbkdf2Sha256Async, verifyPinAgainstRecord, verifyPinAgainstRecordAsync, isLegacyPlainPinRecord, PIN_VERIFIER_POLICY } from '../src/utils/pinVerifier.mjs';

const hex = (bytes) => Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');

test('PBKDF2-HMAC-SHA256 matches a known vector', () => {
  assert.equal(hex(pbkdf2Sha256('password', 'salt', 1, 32)), '120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b');
});

test('yielding PBKDF2-HMAC-SHA256 matches the synchronous known vector', async () => {
  assert.equal(hex(await pbkdf2Sha256Async('password', 'salt', 1, 32, { yieldEvery: 1 })), '120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b');
});

test('protected PIN is stored as a salted verifier, not literal digits', () => {
  const verifier = createPinVerifier('123456', { iterations: 1000, salt: Uint8Array.from({ length: 16 }, (_, i) => i + 1) });
  assert.equal(verifier.includes('123456'), false);
  assert.equal(verifyPinAgainstRecord('123456', verifier), true);
  assert.equal(verifyPinAgainstRecord('654321', verifier), false);
});

test('yielding PIN verification accepts valid records and rejects invalid PINs', async () => {
  const verifier = await createPinVerifierAsync('123456', { iterations: 1000, salt: Uint8Array.from({ length: 16 }, (_, i) => i + 1), yieldEvery: 10 });
  assert.equal(await verifyPinAgainstRecordAsync('123456', verifier, { yieldEvery: 10 }), true);
  assert.equal(await verifyPinAgainstRecordAsync('654321', verifier, { yieldEvery: 10 }), false);
  assert.equal(PIN_VERIFIER_POLICY.iterations, 100000);
});

test('legacy plaintext PIN records are recognised for one-time migration', () => {
  assert.equal(isLegacyPlainPinRecord('123456'), true);
  assert.equal(verifyPinAgainstRecord('123456', '123456'), true);
  assert.equal(verifyPinAgainstRecord('000000', '123456'), false);
});
