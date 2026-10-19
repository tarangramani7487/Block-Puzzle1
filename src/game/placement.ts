import { BOARD_SIZE } from './constants';
import { getShape } from './shapes';
import type { Board, Coord, ShapeDef } from './types';

export function createEmptyBoard(size = BOARD_SIZE): Board {
  return Array.from({ length: size }, () => Array<number>(size).fill(0));
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice());
}

export function isInside(board: Board, row: number, col: number): boolean {
  return row >= 0 && col >= 0 && row < board.length && col < board[0].length;
}

/** Absolute board coordinates a shape would cover with its top-left at (row, col). */
export function shapeCellsAt(shape: ShapeDef, row: number, col: number): Coord[] {
  return shape.cells.map(([r, c]) => [row + r, col + c] as const);
}

/** True when every cell of the shape is inside the board and empty. */
export function canPlace(board: Board, shape: ShapeDef | string, row: number, col: number): boolean {
  const def = typeof shape === 'string' ? getShape(shape) : shape;
  for (const [r, c] of def.cells) {
    const br = row + r;
    const bc = col + c;
    if (!isInside(board, br, bc) || board[br][bc] !== 0) return false;
  }
  return true;
}

/** Returns a new board with the shape placed at `level`. Throws on invalid placement. */
export function placeShape(board: Board, shape: ShapeDef, row: number, col: number, level: number): Board {
  if (!canPlace(board, shape, row, col)) {
    throw new Error(`Invalid placement of ${shape.id} at ${row},${col}`);
  }
  const next = cloneBoard(board);
  for (const [r, c] of shapeCellsAt(shape, row, col)) next[r][c] = level;
  return next;
}

/** True if the shape fits anywhere on the board. */
export function fitsAnywhere(board: Board, shape: ShapeDef | string): boolean {
  const def = typeof shape === 'string' ? getShape(shape) : shape;
  const size = board.length;
  for (let row = 0; row <= size - def.rows; row++) {
    for (let col = 0; col <= board[0].length - def.cols; col++) {
      if (canPlace(board, def, row, col)) return true;
    }
  }
  return false;
}

export function countFilled(board: Board): number {
  let n = 0;
  for (const row of board) for (const cell of row) if (cell !== 0) n++;
  return n;
}
