import { fitsAnywhere } from './placement';
import type { Board, Tray } from './types';

/** True if at least one remaining tray piece can be placed somewhere. */
export function canAnyPieceFit(board: Board, tray: Tray): boolean {
  return tray.some((piece) => piece !== null && fitsAnywhere(board, piece.shapeId));
}

/** Game over only when pieces remain and none of them fit. */
export function isGameOver(board: Board, tray: Tray): boolean {
  return tray.some((p) => p !== null) && !canAnyPieceFit(board, tray);
}
