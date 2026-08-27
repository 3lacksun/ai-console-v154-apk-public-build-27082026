import test from 'node:test';
import assert from 'node:assert/strict';
import {
  beginFullVoiceTurn, callbackBelongsToVoiceRun, createFullVoiceSession, FullVoiceState,
  recoverFullVoiceAfterLifecycleInterruption, shouldAutoListenAfterSpeech, shouldAutoSendTranscript,
  shouldSpeakAssistantResponse, splitSpeechSentences, transitionFullVoiceSession, voiceStateAnnouncement,
} from '../src/voice/fullVoiceMode.mjs';

const listeningSession = (id='session-1') => {
  let s=createFullVoiceSession({enabled:true,sessionId:id});
  s=transitionFullVoiceSession(s,FullVoiceState.REQUESTING_PERMISSION,{recognitionRunId:'stt-1'});
  return transitionFullVoiceSession(s,FullVoiceState.LISTENING,{permissionStatus:'granted'});
};

const generatingSession = (id='session-g') => transitionFullVoiceSession(beginFullVoiceTurn(listeningSession(id),'hello'),FullVoiceState.GENERATING);

test('v1.5 Full Voice follows the locked permission → listen → finalise → generate → speak loop',()=>{
  let s=listeningSession();
  s=beginFullVoiceTurn(s,'hello');
  assert.equal(s.state,FullVoiceState.FINALIZING_STT);
  assert.equal(s.voiceTurnId,'session-1-turn-1');
  s=transitionFullVoiceSession(s,FullVoiceState.GENERATING);
  s=transitionFullVoiceSession(s,FullVoiceState.SPEAKING,{ttsRunId:'tts-1'});
  assert.equal(shouldAutoSendTranscript(s,'hello'),true);
  assert.equal(shouldSpeakAssistantResponse(s,'answer'),true);
  assert.equal(shouldAutoListenAfterSpeech(s),true);
});

test('permission denial is distinct and can retry permission safely',()=>{
  let s=createFullVoiceSession({enabled:true,sessionId:'permission'});
  s=transitionFullVoiceSession(s,FullVoiceState.REQUESTING_PERMISSION);
  s=transitionFullVoiceSession(s,FullVoiceState.PERMISSION_DENIED,{error:'denied',permissionStatus:'denied'});
  assert.equal(s.state,FullVoiceState.PERMISSION_DENIED);
  assert.equal(s.error,'denied');
  assert.equal(transitionFullVoiceSession(s,FullVoiceState.REQUESTING_PERMISSION).state,FullVoiceState.REQUESTING_PERMISSION);
});

test('STT, generation and TTS failures remain separate recoverable states',()=>{
  const stt=transitionFullVoiceSession(transitionFullVoiceSession(createFullVoiceSession({enabled:true}),FullVoiceState.REQUESTING_PERMISSION),FullVoiceState.STT_ERROR,{error:'stt'});
  const generation=transitionFullVoiceSession(generatingSession(),FullVoiceState.GENERATION_ERROR,{error:'generation'});
  const speaking=transitionFullVoiceSession(generatingSession('session-tts'),FullVoiceState.SPEAKING,{ttsRunId:'tts'});
  const tts=transitionFullVoiceSession(speaking,FullVoiceState.TTS_ERROR,{error:'tts'});
  assert.deepEqual([stt.state,generation.state,tts.state],[FullVoiceState.STT_ERROR,FullVoiceState.GENERATION_ERROR,FullVoiceState.TTS_ERROR]);
  assert.equal(transitionFullVoiceSession(generation,FullVoiceState.IDLE).state,FullVoiceState.IDLE);
});

test('callback identity rejects stale session, turn, STT and TTS runs',()=>{
  const s={...createFullVoiceSession({enabled:true,sessionId:'session-x'}),voiceTurnId:'turn-x',recognitionRunId:'stt-x',ttsRunId:'tts-x'};
  assert.equal(callbackBelongsToVoiceRun(s,{sessionId:'session-x',voiceTurnId:'turn-x',recognitionRunId:'stt-x',ttsRunId:'tts-x'}),true);
  assert.equal(callbackBelongsToVoiceRun(s,{sessionId:'old'}),false);
  assert.equal(callbackBelongsToVoiceRun(s,{sessionId:'session-x',voiceTurnId:'old'}),false);
  assert.equal(callbackBelongsToVoiceRun(s,{sessionId:'session-x',recognitionRunId:'old'}),false);
  assert.equal(callbackBelongsToVoiceRun(s,{sessionId:'session-x',ttsRunId:'old'}),false);
});

test('lifecycle interruption recovers conservatively to STOPPED without auto-listen',()=>{
  let s=recoverFullVoiceAfterLifecycleInterruption({...listeningSession('life'),autoListenPending:true});
  assert.equal(s.state,FullVoiceState.STOPPED);
  assert.equal(s.autoListenPending,false);
  assert.equal(shouldAutoListenAfterSpeech(s),false);
});

test('TTS sentence segmentation supports restart-from-sentence semantics',()=>{
  assert.deepEqual(splitSpeechSentences('One. Two! Three?'),['One.','Two!','Three?']);
  assert.deepEqual(splitSpeechSentences('Single response'),['Single response']);
  assert.deepEqual(splitSpeechSentences(''),[]);
});

test('Auto-send/Auto-listen disabled semantics and repeated voice turns are stable',()=>{
  let s=createFullVoiceSession({enabled:true,autoSend:false,autoListen:false,sessionId:'repeat'});
  s=transitionFullVoiceSession(s,FullVoiceState.REQUESTING_PERMISSION);
  s=transitionFullVoiceSession(s,FullVoiceState.LISTENING);
  s=beginFullVoiceTurn(s,'first');
  assert.equal(shouldAutoSendTranscript(s,'first'),false);
  s=transitionFullVoiceSession(s,FullVoiceState.READY_TO_SEND);
  s=transitionFullVoiceSession(s,FullVoiceState.REQUESTING_PERMISSION);
  s=transitionFullVoiceSession(s,FullVoiceState.LISTENING);
  s=beginFullVoiceTurn(s,'second');
  assert.equal(s.turnSequence,2);
  assert.equal(s.voiceTurnId,'repeat-turn-2');
  assert.equal(shouldAutoListenAfterSpeech(s),false);
});

test('state announcements are concise and invalid transitions remain rejected',()=>{
  assert.equal(voiceStateAnnouncement(FullVoiceState.LISTENING),'Listening');
  assert.equal(voiceStateAnnouncement(FullVoiceState.GENERATING),'Generating response');
  assert.throws(()=>transitionFullVoiceSession(createFullVoiceSession({enabled:true}),FullVoiceState.GENERATING),/Invalid full-voice transition/);
});
