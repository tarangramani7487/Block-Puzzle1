import { createInitialState } from '../gameEngine';
import type { Board, GameState, Piece, Tray } from '../types';

/** Parses a 10-row ASCII board: '.' is empty, digits are levels. */
export function boardFrom(rows: string[]): Board {
  return rows.map((line) => [...line.replace(/\s/g, '')].map((ch) => (ch === '.' ? 0 : Number(ch))));
}

export function boardToStrings(board: Board): string[] {
  return board.map((row) => row.map((c) => (c === 0 ? '.' : String(c))).join(''));
}

export function piece(shapeId: string, level = 1, id = 100): Piece {
  return { id, shapeId, level };
}

export function stateWith(board: Board, tray: Tray, overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialState(42), board, tray, ...overrides };
}

export const EMPTY_ROW = '..........';
export const emptyRows = (n: number) => Array<string>(n).fill(EMPTY_ROW);
