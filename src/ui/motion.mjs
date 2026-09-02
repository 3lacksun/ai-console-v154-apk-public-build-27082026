import { uiTokens } from './tokens.js';

export const MotionKind = Object.freeze({
  STATE: 'STATE',
  SHEET: 'SHEET',
  SCREEN: 'SCREEN',
  CONFIRMATION: 'CONFIRMATION',
});

export const motionDuration = (kind = MotionKind.STATE, reduced = false) => {
  if (reduced) return uiTokens.motion.reduced;
  if (kind === MotionKind.SHEET || kind === MotionKind.SCREEN) return uiTokens.motion.normal;
  return uiTokens.motion.fast;
};

export const modalAnimation = (kind = MotionKind.SHEET, reduced = false) => {
  if (reduced) return 'none';
  return kind === MotionKind.STATE || kind === MotionKind.CONFIRMATION ? 'fade' : 'slide';
};
