export function extractSpeechTranscript(event) {
  return String(event?.results?.[0]?.transcript || '').trim();
}

export function isRecoverableAndroidManualStopError({ event, manualStopRequested, transcript, platform }) {
  if (platform !== 'android' || !manualStopRequested || !String(transcript || '').trim()) return false;
  return event?.error === 'client' || Number(event?.code) === 5;
}
