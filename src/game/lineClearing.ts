import { cloneBoard } from './placement';
import type { Board } from './types';

export interface FullLines {
  rows: number[];
  cols: number[];
}

export function findFullLines(board: Board): FullLines {
  const rows: number[] = [];
  const cols: number[] = [];
  const size = board.length;
  const width = board[0].length;
  for (let r = 0; r < size; r++) {
    if (board[r].every((cell) => cell !== 0)) rows.push(r);
  }
  for (let c = 0; c < width; c++) {
    let full = true;
    for (let r = 0; r < size; r++) {
      if (board[r][c] === 0) {
        full = false;
        break;
      }
    }
    if (full) cols.push(c);
  }
  return { rows, cols };
}

export interface ClearResult {
  board: Board;
  /** Every removed cell exactly once (row/column intersections are not duplicated). */
  cleared: { row: number; col: number; level: number }[];
}

/** Clears all given rows and columns simultaneously. */
export function clearLines(board: Board, lines: FullLines): ClearResult {
  const next = cloneBoard(board);
  const cleared: ClearResult['cleared'] = [];
  const rowSet = new Set(lines.rows);
  const colSet = new Set(lines.cols);
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      if ((rowSet.has(r) || colSet.has(c)) && board[r][c] !== 0) {
        cleared.push({ row: r, col: c, level: board[r][c] });
        next[r][c] = 0;
      }
    }
  }
  return { board: next, cleared };
}
