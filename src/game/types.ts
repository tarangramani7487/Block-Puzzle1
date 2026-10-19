/**
 * Core game types. The board is an explicit 2D grid of cells where
 * `0` means empty and `1..MAX_LEVEL` is the fusion level of the block.
 */

/** 0 = empty, 1..MAX_LEVEL = occupied with that fusion level. */
export type Cell = number;

/** board[row][col] */
export type Board = Cell[][];

/** A grid coordinate: [row, col]. */
export type Coord = readonly [number, number];

export interface ShapeDef {
  id: string;
  /** Offsets relative to the shape's top-left bounding box corner. */
  cells: readonly Coord[];
  rows: number;
  cols: number;
  /** Relative spawn weight. */
  weight: number;
}

export interface Piece {
  /** Unique, monotonically increasing id (stable React key). */
  id: number;
  shapeId: string;
  /** Fusion level every cell of this piece starts at. */
  level: number;
}

export type Tray = (Piece | null)[];

/** Everything needed to fully restore a game position. */
export interface GameSnapshot {
  board: Board;
  tray: Tray;
  score: number;
  /** Number of consecutive clearing moves (0 = no active combo). */
  combo: number;
  /** Moves made since the last line clear (used for combo grace). */
  movesSinceClear: number;
  moveCount: number;
  nextPieceId: number;
  rngState: number;
}

export interface GameState extends GameSnapshot {
  version: 1;
  gameOver: boolean;
  undosLeft: number;
  /** Position before the most recent move, for single-step undo. */
  previous: GameSnapshot | null;
}

export interface FusionStep {
  /** Cells that took part in this step (before upgrade). */
  cells: Coord[];
  fromLevel: number;
  /** New level, or null when a max-level group bursts and is removed. */
  toLevel: number | null;
  /** 1 for the first step of a chain, 2 for the next, ... */
  chainIndex: number;
  points: number;
}

export interface ScoreBreakdown {
  placement: number;
  lines: number;
  fusion: number;
  perfectClear: number;
  total: number;
}

export interface MoveResult {
  moveId: number;
  piece: Piece;
  /** Absolute board coordinates of the placed piece cells. */
  placedCells: Coord[];
  clearedRows: number[];
  clearedCols: number[];
  /** Cleared cells with the level they had, for effects. */
  clearedCells: { row: number; col: number; level: number }[];
  fusionSteps: FusionStep[];
  combo: number;
  score: ScoreBreakdown;
  perfectClear: boolean;
  trayRefilled: boolean;
  gameOver: boolean;
}

export type MoveOutcome =
  | { ok: true; state: GameState; result: MoveResult }
  | { ok: false; reason: 'game-over' | 'no-piece' | 'invalid-position' };
