/**
 * Game engine: pure, deterministic state transitions.
 *
 * Move resolution order (all on the same authoritative board):
 *   1. Validate & place the piece.
 *   2. Detect every full row and column, clear them all at once.
 *   3. Resolve fusion seeded by the surviving placed cells (see fusion.ts).
 *   4. Score: placement + lines (× combo) + fusion steps + perfect clear.
 *   5. Remove the piece from the tray; refill when all three are used.
 *   6. Game over if none of the remaining tray pieces fits anywhere.
 */
import { BOARD_SIZE, POINTS, UNDOS_PER_GAME } from './constants';
import { resolveFusion } from './fusion';
import { isGameOver } from './gameOver';
import { clearLines, findFullLines } from './lineClearing';
import { canPlace, countFilled, createEmptyBoard, placeShape, shapeCellsAt } from './placement';
import { randomSeed } from './random';
import { linePoints, nextCombo, placementPoints } from './scoring';
import { generateTray } from './shapeGenerator';
import { getShape } from './shapes';
import type { GameSnapshot, GameState, MoveOutcome, MoveResult } from './types';

export function createInitialState(seed: number = randomSeed()): GameState {
  const board = createEmptyBoard(BOARD_SIZE);
  const { tray, rngState, nextPieceId } = generateTray(board, seed, 1);
  return {
    version: 1,
    board,
    tray,
    score: 0,
    combo: 0,
    movesSinceClear: 0,
    moveCount: 0,
    nextPieceId,
    rngState,
    gameOver: false,
    undosLeft: UNDOS_PER_GAME,
    previous: null,
  };
}

function snapshotOf(state: GameState): GameSnapshot {
  const { board, tray, score, combo, movesSinceClear, moveCount, nextPieceId, rngState } = state;
  return { board, tray, score, combo, movesSinceClear, moveCount, nextPieceId, rngState };
}

/** Checks a placement without changing anything (used for drag previews). */
export function canPlacePiece(state: GameState, trayIndex: number, row: number, col: number): boolean {
  const piece = state.tray[trayIndex];
  if (state.gameOver || !piece) return false;
  return canPlace(state.board, piece.shapeId, row, col);
}

export function applyMove(state: GameState, trayIndex: number, row: number, col: number): MoveOutcome {
  if (state.gameOver) return { ok: false, reason: 'game-over' };
  const piece = state.tray[trayIndex];
  if (!piece) return { ok: false, reason: 'no-piece' };
  const shape = getShape(piece.shapeId);
  if (!canPlace(state.board, shape, row, col)) return { ok: false, reason: 'invalid-position' };

  // 1. Place
  const placedCells = shapeCellsAt(shape, row, col);
  const placedBoard = placeShape(state.board, shape, row, col, piece.level);

  // 2. Line clearing
  const lines = findFullLines(placedBoard);
  const { board: clearedBoard, cleared } = clearLines(placedBoard, lines);
  const lineCount = lines.rows.length + lines.cols.length;

  // 3. Fusion on surviving placed cells
  const { board: finalBoard, steps } = resolveFusion(clearedBoard, placedCells, piece.level);

  // 4. Scoring
  const comboState = nextCombo(state, lineCount);
  const perfectClear = (lineCount > 0 || steps.length > 0) && countFilled(finalBoard) === 0;
  const score = {
    placement: placementPoints(placedCells.length),
    lines: linePoints(lineCount, comboState.combo),
    fusion: steps.reduce((sum, s) => sum + s.points, 0),
    perfectClear: perfectClear ? POINTS.perfectClear : 0,
    total: 0,
  };
  score.total = score.placement + score.lines + score.fusion + score.perfectClear;

  // 5. Tray
  let tray = state.tray.map((p, i) => (i === trayIndex ? null : p));
  let rngState = state.rngState;
  let nextPieceId = state.nextPieceId;
  const trayRefilled = tray.every((p) => p === null);
  if (trayRefilled) {
    const generated = generateTray(finalBoard, rngState, nextPieceId);
    tray = generated.tray;
    rngState = generated.rngState;
    nextPieceId = generated.nextPieceId;
  }

  // 6. Game over
  const gameOver = isGameOver(finalBoard, tray);

  const next: GameState = {
    version: 1,
    board: finalBoard,
    tray,
    score: state.score + score.total,
    combo: comboState.combo,
    movesSinceClear: comboState.movesSinceClear,
    moveCount: state.moveCount + 1,
    nextPieceId,
    rngState,
    gameOver,
    undosLeft: state.undosLeft,
    previous: snapshotOf(state),
  };

  const result: MoveResult = {
    moveId: next.moveCount,
    piece,
    placedCells,
    clearedRows: lines.rows,
    clearedCols: lines.cols,
    clearedCells: cleared,
    fusionSteps: steps,
    combo: comboState.combo,
    score,
    perfectClear,
    trayRefilled,
    gameOver,
  };

  return { ok: true, state: next, result };
}

export function canUndo(state: GameState): boolean {
  return !state.gameOver && state.previous !== null && state.undosLeft > 0;
}

/** Reverts the last move (one level deep). Returns the same state if not allowed. */
export function undoMove(state: GameState): GameState {
  if (!canUndo(state) || !state.previous) return state;
  return {
    ...state.previous,
    version: 1,
    gameOver: false,
    undosLeft: state.undosLeft - 1,
    previous: null,
  };
}
