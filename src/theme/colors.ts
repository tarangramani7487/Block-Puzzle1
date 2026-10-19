export const colors = {
  // Royal-blue arcade background, like classic jewel block puzzles.
  bgTop: '#2A1E8C',
  bgBottom: '#1426B0',
  header: '#1E1670',
  surface: '#221B78',
  surfaceRaised: '#2E2690',
  surfaceBorder: '#4537B8',
  tray: 'rgba(14, 18, 90, 0.55)',
  board: '#100E52',
  boardBorder: '#2FB4FF',
  gridLine: 'rgba(47, 180, 255, 0.55)',
  emptyCell: '#1E1849',
  emptyCellInner: '#251E57',
  text: '#FFFFFF',
  textDim: '#B4ADF0',
  textMuted: '#7A72C0',
  gold: '#FFD166',
  goldDark: '#E0A526',
  valid: '#7CFFB2',
  invalid: '#FF4D6D',
  overlay: 'rgba(8, 6, 40, 0.78)',
  primary: '#7C5CFF',
  primaryLight: '#A48CFF',
  primaryDark: '#5235D6',
  sparkle: '#7FE3FF',
} as const;

export interface LevelPalette {
  base: string;
  light: string;
  dark: string;
  glow: string;
}

/** Index 1..6 = fusion level. Index 0 is unused. */
export const LEVEL_COLORS: readonly LevelPalette[] = [
  { base: '#000000', light: '#000000', dark: '#000000', glow: '#000000' },
  { base: '#2ED3B0', light: '#8FF5DE', dark: '#13917A', glow: 'rgba(46,211,176,0.55)' },
  { base: '#86D42A', light: '#C9F58A', dark: '#4E9410', glow: 'rgba(134,212,42,0.55)' },
  { base: '#FFC21C', light: '#FFE68A', dark: '#C98A00', glow: 'rgba(255,194,28,0.55)' },
  { base: '#FF7A2E', light: '#FFB98A', dark: '#C24A0C', glow: 'rgba(255,122,46,0.55)' },
  { base: '#F2577A', light: '#FFA6BB', dark: '#B32549', glow: 'rgba(242,87,122,0.55)' },
  { base: '#B44DFF', light: '#DDA8FF', dark: '#7419C2', glow: 'rgba(180,77,255,0.6)' },
];

export const levelColor = (level: number): LevelPalette =>
  LEVEL_COLORS[Math.min(Math.max(level, 1), LEVEL_COLORS.length - 1)];
