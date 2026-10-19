import AsyncStorage from '@react-native-async-storage/async-storage';

import { BOARD_SIZE, MAX_LEVEL, TRAY_SIZE, UNDOS_PER_GAME } from '../game/constants';
import { isGameOver } from '../game/gameOver';
import { isKnownShape } from '../game/shapes';
import type { Board, GameSnapshot, GameState, Piece, Tray } from '../game/types';

export const STORAGE_KEYS = {
  best: 'blockfusion:best',
  settings: 'blockfusion:settings',
  game: 'blockfusion:game',
} as const;

export interface Settings {
  sound: boolean;
  haptics: boolean;
}

export const DEFAULT_SETTINGS: Settings = { sound: true, haptics: true };

// ---------- validation (pure, never throws) ----------

const isInt = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

function parseBoard(v: unknown): Board | null {
  if (!Array.isArray(v) || v.length !== BOARD_SIZE) return null;
  for (const row of v) {
    if (!Array.isArray(row) || row.length !== BOARD_SIZE) return null;
    if (!row.every((cell) => isInt(cell, 0, MAX_LEVEL))) return null;
  }
  return (v as number[][]).map((row) => row.slice());
}

function parsePiece(v: unknown): Piece | null {
  if (typeof v !== 'object' || v === null) return null;
  const p = v as Record<string, unknown>;
  if (!isInt(p.id, 0) || typeof p.shapeId !== 'string' || !isKnownShape(p.shapeId)) return null;
  if (!isInt(p.level, 1, MAX_LEVEL)) return null;
  return { id: p.id, shapeId: p.shapeId, level: p.level };
}

function parseTray(v: unknown): Tray | null {
  if (!Array.isArray(v) || v.length !== TRAY_SIZE) return null;
  const tray: Tray = [];
  for (const item of v) {
    if (item === null) tray.push(null);
    else {
      const piece = parsePiece(item);
      if (!piece) return null;
      tray.push(piece);
    }
  }
  return tray.some((p) => p !== null) ? tray : null;
}

function parseSnapshot(v: unknown): GameSnapshot | null {
  if (typeof v !== 'object' || v === null) return null;
  const s = v as Record<string, unknown>;
  const board = parseBoard(s.board);
  const tray = parseTray(s.tray);
  if (!board || !tray) return null;
  if (!isInt(s.score) || !isInt(s.combo) || !isInt(s.movesSinceClear) || !isInt(s.moveCount)) return null;
  if (!isInt(s.nextPieceId, 1) || typeof s.rngState !== 'number' || !Number.isInteger(s.rngState)) return null;
  return {
    board,
    tray,
    score: s.score,
    combo: s.combo,
    movesSinceClear: s.movesSinceClear,
    moveCount: s.moveCount,
    nextPieceId: s.nextPieceId,
    rngState: s.rngState | 0,
  };
}

/** Validates untrusted JSON into a playable GameState, or null. */
export function parseSavedGame(raw: string | null): GameState | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;
  if (d.version !== 1) return null;
  const snapshot = parseSnapshot(d);
  if (!snapshot) return null;
  const previous = d.previous == null ? null : parseSnapshot(d.previous);
  // Recompute game over rather than trusting the stored flag.
  if (isGameOver(snapshot.board, snapshot.tray)) return null;
  return {
    ...snapshot,
    version: 1,
    gameOver: false,
    undosLeft: isInt(d.undosLeft, 0, UNDOS_PER_GAME) ? d.undosLeft : 0,
    previous,
  };
}

export function serializeGame(state: GameState): string {
  return JSON.stringify(state);
}

export function parseSettings(raw: string | null): Settings {
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    const d = JSON.parse(raw) as Record<string, unknown>;
    return {
      sound: typeof d?.sound === 'boolean' ? d.sound : DEFAULT_SETTINGS.sound,
      haptics: typeof d?.haptics === 'boolean' ? d.haptics : DEFAULT_SETTINGS.haptics,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function parseBest(raw: string | null): number {
  const n = raw == null ? NaN : Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

// ---------- AsyncStorage I/O (failures are logged, never thrown) ----------

async function safeGet(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    console.warn('storage read failed', key, e);
    return null;
  }
}

async function safeSet(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.warn('storage write failed', key, e);
  }
}

export interface PersistedData {
  best: number;
  settings: Settings;
  game: GameState | null;
}

export async function loadAll(): Promise<PersistedData> {
  const [best, settings, game] = await Promise.all([
    safeGet(STORAGE_KEYS.best),
    safeGet(STORAGE_KEYS.settings),
    safeGet(STORAGE_KEYS.game),
  ]);
  return { best: parseBest(best), settings: parseSettings(settings), game: parseSavedGame(game) };
}

export const saveBest = (best: number) => safeSet(STORAGE_KEYS.best, String(best));
export const saveSettings = (s: Settings) => safeSet(STORAGE_KEYS.settings, JSON.stringify(s));
export const saveGame = (state: GameState) => safeSet(STORAGE_KEYS.game, serializeGame(state));
export async function clearSavedGame(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.game);
  } catch (e) {
    console.warn('storage remove failed', e);
  }
}
