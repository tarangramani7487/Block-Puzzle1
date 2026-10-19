import { BOARD_SIZE, SPAWN_LEVEL_WEIGHTS, TRAY_SIZE } from './constants';
import { countFilled, fitsAnywhere } from './placement';
import { Rng } from './random';
import { LARGE_SHAPE_CELLS, SHAPES } from './shapes';
import type { Board, Piece, ShapeDef } from './types';

/**
 * Spawn weight adjusted for how crowded the board is: large shapes become
 * rarer and tiny shapes more common as the board fills up.
 */
export function adjustedWeight(shape: ShapeDef, fillRatio: number): number {
  const size = shape.cells.length;
  if (size >= LARGE_SHAPE_CELLS) return shape.weight * Math.max(0.15, 1 - fillRatio * 1.3);
  if (size <= 2) return shape.weight * (1 + fillRatio * 2);
  return shape.weight;
}

function pickShapes(rng: Rng, fillRatio: number): ShapeDef[] {
  const picked: ShapeDef[] = [];
  while (picked.length < TRAY_SIZE) {
    const hasLarge = picked.some((s) => s.cells.length >= LARGE_SHAPE_CELLS);
    const candidates = SHAPES.filter(
      (s) => !picked.includes(s) && !(hasLarge && s.cells.length >= LARGE_SHAPE_CELLS),
    );
    picked.push(rng.weighted(candidates, (s) => adjustedWeight(s, fillRatio)));
  }
  return picked;
}

export interface TrayResult {
  tray: Piece[];
  rngState: number;
  nextPieceId: number;
}

/**
 * Generates a balanced tray of three pieces for the given board:
 * - no duplicate shapes and at most one large (5+ cell) shape per tray,
 * - weights adapt to board fullness,
 * - prefers trays where every piece fits; always guarantees at least one
 *   piece fits whenever the board has any empty cell.
 */
export function generateTray(board: Board, rngState: number, nextPieceId: number): TrayResult {
  const rng = new Rng(rngState);
  const fillRatio = countFilled(board) / (BOARD_SIZE * BOARD_SIZE);

  let shapes: ShapeDef[] = [];
  const ATTEMPTS = 16;
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    shapes = pickShapes(rng, fillRatio);
    const fitting = shapes.filter((s) => fitsAnywhere(board, s)).length;
    // Early attempts demand all pieces fit, later ones settle for one.
    if (fitting === TRAY_SIZE || (attempt >= ATTEMPTS / 2 && fitting > 0)) break;
  }

  if (!shapes.some((s) => fitsAnywhere(board, s))) {
    const fallback = SHAPES.filter((s) => fitsAnywhere(board, s)).sort(
      (a, b) => b.cells.length - a.cells.length,
    )[0];
    if (fallback) shapes[0] = fallback;
  }

  let id = nextPieceId;
  const tray = shapes.map((s) => ({
    id: id++,
    shapeId: s.id,
    level: rng.weighted(SPAWN_LEVEL_WEIGHTS, ([, w]) => w)[0],
  }));
  return { tray, rngState: rng.state, nextPieceId: id };
}
