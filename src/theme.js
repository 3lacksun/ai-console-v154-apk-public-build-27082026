export const COMMAND_CENTRE_COLORS = {
  black: '#080808',
  bg: '#f7f7f5',
  bgHeader: '#ffffff',
  panel: '#ffffff',
  panelAlt: '#efefec',
  surfaceElevated: '#ffffff',
  shadow: '#000000',
  border: '#d7d7d2',
  borderLight: '#aaaaa4',
  textPrimary: '#0a0a0a',
  textSecondary: '#2f2f2d',
  textMuted: '#60605c',
  textFaint: '#85857f',
  cyan: '#111111',
  cyanBright: '#050505',
  cyanDim: '#e7e7e3',
  cyanBorder: '#363634',
  rose: '#3f3f46',
  roseBg: '#ececea',
  roseBorder: '#73736f',
  roseToast: '#262624',
  emerald: '#171717',
  overlay: 'rgba(8,8,8,0.58)',
  userText: '#ffffff',
};

// The app is intentionally locked to the requested white Command Centre presentation.
export const LIGHT_COLORS = COMMAND_CENTRE_COLORS;
export const DARK_COLORS = COMMAND_CENTRE_COLORS;

export const getColors = () => COMMAND_CENTRE_COLORS;
export const colors = COMMAND_CENTRE_COLORS;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};
