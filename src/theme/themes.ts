import { LEVEL_COLORS, type LevelPalette } from './colors';

export interface Theme {
  id: string;
  name: string;
  /** Coins to unlock; 0 = free. */
  price: number;
  /** Index 1..6 = fusion level. Index 0 is unused. */
  levels: readonly LevelPalette[];
  board: string;
  boardBorder: string;
  gridLine: string;
}

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (rgb: number[]) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
const mix = (h: string, target: number, amount: number) => toHex(hex(h).map((v) => v + (target - v) * amount));

/** Builds a bevel palette (light top, dark bottom, glow) from one base colour. */
function palette(base: string): LevelPalette {
  const [r, g, b] = hex(base);
  return { base, light: mix(base, 255, 0.45), dark: mix(base, 0, 0.32), glow: `rgba(${r},${g},${b},0.55)` };
}

const levels = (...bases: string[]): LevelPalette[] => [LEVEL_COLORS[0], ...bases.map(palette)];

export const THEMES: readonly Theme[] = [
  {
    id: 'jewel',
    name: 'Jewel',
    price: 0,
    levels: LEVEL_COLORS,
    board: '#100E52',
    boardBorder: '#2FB4FF',
    gridLine: 'rgba(47, 180, 255, 0.55)',
  },
  {
    id: 'candy',
    name: 'Candy',
    price: 300,
    levels: levels('#7FD8F5', '#A8E66A', '#FFE066', '#FFAA66', '#FF85B3', '#C89BFF'),
    board: '#2B1747',
    boardBorder: '#FF85B3',
    gridLine: 'rgba(255, 133, 179, 0.4)',
  },
  {
    id: 'neon',
    name: 'Neon',
    price: 500,
    levels: levels('#00F0FF', '#39FF14', '#FFF01F', '#FF6B00', '#FF2079', '#BC13FE'),
    board: '#05050F',
    boardBorder: '#39FF14',
    gridLine: 'rgba(57, 255, 20, 0.35)',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    price: 800,
    levels: levels('#9BE7E0', '#4FD1C5', '#2CA6D9', '#2F6FE0', '#5B48D9', '#F2C14E'),
    board: '#04213B',
    boardBorder: '#4FD1C5',
    gridLine: 'rgba(79, 209, 197, 0.4)',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    price: 800,
    levels: levels('#FFD36E', '#FFA552', '#FF7B54', '#E8505B', '#B83B7E', '#6A3093'),
    board: '#2A0E2E',
    boardBorder: '#FF7B54',
    gridLine: 'rgba(255, 123, 84, 0.4)',
  },
  {
    id: 'royal',
    name: 'Royal Gold',
    price: 1200,
    levels: levels('#C9D1E0', '#7FB2FF', '#8E7CFF', '#D65DB1', '#FF9671', '#FFC93C'),
    board: '#14102B',
    boardBorder: '#FFC93C',
    gridLine: 'rgba(255, 201, 60, 0.38)',
  },
];

export const DEFAULT_THEME_ID = THEMES[0].id;

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export const isKnownTheme = (id: unknown): id is string => typeof id === 'string' && THEMES.some((t) => t.id === id);

export function themeLevel(theme: Theme, level: number): LevelPalette {
  return theme.levels[Math.min(Math.max(level, 1), theme.levels.length - 1)];
}
