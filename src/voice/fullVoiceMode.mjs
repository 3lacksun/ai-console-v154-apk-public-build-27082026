let sessionCounter = 0;

const createSessionId = (now = Date.now()) => `voice-session-${now}-${++sessionCounter}`;
const createTurnId = (sessionId, sequence) => `${sessionId}-turn-${sequence}`;

export const FullVoiceState = Object.freeze({
  IDLE: 'IDLE',
  REQUESTING_PERMISSION: 'REQUESTING_PERMISSION',
  LISTENING: 'LISTENING',
  FINALIZING_STT: 'FINALIZING_STT',
  READY_TO_SEND: 'READY_TO_SEND',
  GENERATING: 'GENERATING',
  SPEAKING: 'SPEAKING',
  INTERRUPTING: 'INTERRUPTING',
  STOPPED: 'STOPPED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  STT_ERROR: 'STT_ERROR',
  GENERATION_ERROR: 'GENERATION_ERROR',
  TTS_ERROR: 'TTS_ERROR',
});

const ALL_RECOVERABLE = [
  FullVoiceState.IDLE,
  FullVoiceState.REQUESTING_PERMISSION,
  FullVoiceState.LISTENING,
  FullVoiceState.STOPPED,
];

const ALLOWED = {
  IDLE: [FullVoiceState.REQUESTING_PERMISSION, FullVoiceState.SPEAKING, FullVoiceState.STOPPED],
  REQUESTING_PERMISSION: [FullVoiceState.LISTENING, FullVoiceState.PERMISSION_DENIED, FullVoiceState.STT_ERROR, FullVoiceState.STOPPED],
  LISTENING: [FullVoiceState.FINALIZING_STT, FullVoiceState.STOPPED, FullVoiceState.STT_ERROR, FullVoiceState.INTERRUPTING],
  FINALIZING_STT: [FullVoiceState.READY_TO_SEND, FullVoiceState.GENERATING, FullVoiceState.STOPPED, FullVoiceState.STT_ERROR],
  READY_TO_SEND: [FullVoiceState.GENERATING, FullVoiceState.REQUESTING_PERMISSION, FullVoiceState.STOPPED, FullVoiceState.IDLE],
  GENERATING: [FullVoiceState.SPEAKING, FullVoiceState.IDLE, FullVoiceState.GENERATION_ERROR, FullVoiceState.STOPPED],
  SPEAKING: [FullVoiceState.INTERRUPTING, FullVoiceState.IDLE, FullVoiceState.STOPPED, FullVoiceState.TTS_ERROR],
  INTERRUPTING: [FullVoiceState.REQUESTING_PERMISSION, FullVoiceState.LISTENING, FullVoiceState.STOPPED, FullVoiceState.STT_ERROR],
  STOPPED: [FullVoiceState.IDLE, FullVoiceState.REQUESTING_PERMISSION, FullVoiceState.SPEAKING],
  PERMISSION_DENIED: ALL_RECOVERABLE,
  STT_ERROR: ALL_RECOVERABLE,
  GENERATION_ERROR: ALL_RECOVERABLE,
  TTS_ERROR: ALL_RECOVERABLE,
};

const isErrorState = (state) => [FullVoiceState.PERMISSION_DENIED, FullVoiceState.STT_ERROR, FullVoiceState.GENERATION_ERROR, FullVoiceState.TTS_ERROR].includes(state);

export const createFullVoiceSession = ({
  enabled = false,
  autoSend = true,
  autoListen = true,
  speakResponses = true,
  sessionId = createSessionId(),
  turnSequence = 0,
  voiceTurnId = null,
  state = FullVoiceState.IDLE,
  lastTranscript = '',
  lastResponse = '',
  error = null,
  permissionStatus = 'unknown',
  recognitionRunId = null,
  ttsRunId = null,
  speechSentenceIndex = 0,
  autoListenPending = false,
} = {}) => ({
  enabled: Boolean(enabled),
  autoSend: autoSend !== false,
  autoListen: autoListen !== false,
  speakResponses: speakResponses !== false,
  sessionId: String(sessionId || createSessionId()),
  turnSequence: Number.isFinite(Number(turnSequence)) ? Number(turnSequence) : 0,
  voiceTurnId: voiceTurnId ? String(voiceTurnId) : null,
  state: Object.values(FullVoiceState).includes(state) ? state : FullVoiceState.IDLE,
  lastTranscript: String(lastTranscript || ''),
  lastResponse: String(lastResponse || ''),
  error: error ? String(error) : null,
  permissionStatus: String(permissionStatus || 'unknown'),
  recognitionRunId: recognitionRunId ? String(recognitionRunId) : null,
  ttsRunId: ttsRunId ? String(ttsRunId) : null,
  speechSentenceIndex: Math.max(0, Number(speechSentenceIndex) || 0),
  autoListenPending: Boolean(autoListenPending),
});

export const transitionFullVoiceSession = (session, nextState, patch = {}) => {
  const current = session?.state || FullVoiceState.IDLE;
  if (current !== nextState && !(ALLOWED[current] || []).includes(nextState)) throw new Error(`Invalid full-voice transition ${current} -> ${nextState}.`);
  return {
    ...session,
    ...patch,
    state: nextState,
    error: isErrorState(nextState) ? String(patch.error || session?.error || 'Voice mode error.') : null,
  };
};

export const beginFullVoiceTurn = (session, transcript) => {
  const text = String(transcript || '').trim();
  if (!text) return session;
  const sequence = (Number(session?.turnSequence) || 0) + 1;
  const turnId = createTurnId(session?.sessionId || createSessionId(), sequence);
  return transitionFullVoiceSession(session, FullVoiceState.FINALIZING_STT, {
    turnSequence: sequence,
    voiceTurnId: turnId,
    lastTranscript: text,
    autoListenPending: false,
  });
};

export const callbackBelongsToVoiceRun = (session, { sessionId, voiceTurnId = null, recognitionRunId = null, ttsRunId = null } = {}) => {
  if (!session || !sessionId || session.sessionId !== sessionId) return false;
  if (voiceTurnId && session.voiceTurnId !== voiceTurnId) return false;
  if (recognitionRunId && session.recognitionRunId !== recognitionRunId) return false;
  if (ttsRunId && session.ttsRunId !== ttsRunId) return false;
  return true;
};

export const recoverFullVoiceAfterLifecycleInterruption = (session, reason = 'Voice session paused by app lifecycle.') => {
  if (!session?.enabled || [FullVoiceState.IDLE, FullVoiceState.STOPPED].includes(session.state)) return { ...session, autoListenPending: false };
  return transitionFullVoiceSession(session, FullVoiceState.STOPPED, { stopReason: reason, autoListenPending: false, recognitionRunId: null, ttsRunId: null });
};

export const shouldAutoSendTranscript = (session, transcript) => Boolean(session?.enabled && session?.autoSend && String(transcript || '').trim());
export const shouldSpeakAssistantResponse = (session, response) => Boolean(session?.enabled && session?.speakResponses && String(response || '').trim());
export const shouldAutoListenAfterSpeech = (session) => Boolean(session?.enabled && session?.autoListen && session?.state !== FullVoiceState.STOPPED);

export const splitSpeechSentences = (text) => {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const sentences = clean.match(/[^.!?]+[.!?]+(?:["'”’)]*)|[^.!?]+$/g) || [clean];
  return sentences.map((sentence) => sentence.trim()).filter(Boolean);
};

export const voiceStateAnnouncement = (state) => ({
  [FullVoiceState.REQUESTING_PERMISSION]: 'Requesting microphone permission',
  [FullVoiceState.LISTENING]: 'Listening',
  [FullVoiceState.FINALIZING_STT]: 'Finalising speech',
  [FullVoiceState.READY_TO_SEND]: 'Voice transcript ready',
  [FullVoiceState.GENERATING]: 'Generating response',
  [FullVoiceState.SPEAKING]: 'Speaking response',
  [FullVoiceState.INTERRUPTING]: 'Interrupting response',
  [FullVoiceState.STOPPED]: 'Voice stopped',
  [FullVoiceState.PERMISSION_DENIED]: 'Microphone permission denied',
  [FullVoiceState.STT_ERROR]: 'Speech recognition error',
  [FullVoiceState.GENERATION_ERROR]: 'Voice generation error',
  [FullVoiceState.TTS_ERROR]: 'Speech playback error',
}[state] || 'Voice ready');
