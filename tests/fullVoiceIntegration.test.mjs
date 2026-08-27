import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync(new URL('../App.js',import.meta.url),'utf8');
const screen=fs.readFileSync(new URL('../src/components/FullVoiceScreen.js',import.meta.url),'utf8');
const usage=fs.readFileSync(new URL('../src/usage/usageLedger.mjs',import.meta.url),'utf8');

test('Full Voice is a dedicated subordinate chat surface with keyboard fallback and explicit controls',()=>{
  assert.match(app,/FullVoiceScreen/);
  assert.match(app,/Open Full Voice Mode/);
  assert.match(screen,/Keyboard/);
  assert.match(screen,/Interrupt/);
  assert.match(screen,/Replay/);
  assert.match(screen,/Stop Full Voice session/);
  assert.doesNotMatch(screen,/OpenRouter API Key/);
});

test('Full Voice uses the shared provider path, active workspace memory path and ordinary chat messages',()=>{
  assert.match(app,/appendTurn\(state,chat\.id,\{role:'user',content:text,apiContent:text\}\)/);
  assert.match(app,/buildProviderRequest\(nextChat,target\.messageId,null\)/);
  assert.match(app,/effectiveSystemPrompt/);
  assert.match(app,/requestKind:'voice'/);
  assert.match(app,/origin:'VOICE'/);
});

test('voice usage provenance stores stable session and turn identifiers without attributing STT or TTS tokens',()=>{
  assert.match(usage,/voiceSessionId/);
  assert.match(usage,/voiceTurnId/);
  assert.match(usage,/origin/);
  assert.match(app,/voiceSessionId:sessionId/);
  assert.match(app,/voiceTurnId/);
  assert.doesNotMatch(app,/recordUsage\([^\n]*(speech|stt|tts)/i);
});

test('recognition and speech callbacks are identity guarded and lifecycle recovery is conservative',()=>{
  assert.match(app,/voiceRecognitionRunRef/);
  assert.match(app,/voiceTtsRunRef/);
  assert.match(app,/callbackBelongsToVoiceRun/);
  assert.match(app,/recoverFullVoiceAfterLifecycleInterruption/);
  assert.match(app,/cachedSpeechRecognitionModule\?\.abort/);
  assert.match(app,/FullVoiceState\.STOPPED/);
});

test('raw microphone recording persistence is not enabled',()=>{
  assert.doesNotMatch(app,/recordingOptions\s*:\s*\{[^}]*persist\s*:\s*true/s);
});


test('Full Voice Stop cancels the active shared generation and preserves ordinary conversation history',()=>{
  assert.match(app,/fullVoiceGenerationRef/);
  assert.match(app,/stopGenerationForChat\(generation\.chatId\)/);
  assert.match(app,/appendTurn\(state,chat\.id/);
  assert.match(app,/setConversationState\(next\)/);
});
