export const BOARD_SIZE = 10;
export const TRAY_SIZE = 3;

/** Highest fusion level. Fusing a group at this level makes it burst. */
export const MAX_LEVEL = 6;
/** Pieces spawn at these levels with these relative weights. */
export const SPAWN_LEVEL_WEIGHTS: readonly (readonly [level: number, weight: number])[] = [
  [1, 5],
  [2, 4],
  [3, 3],
];

/** A fusion needs a connected same-level group of at least this many cells. */
export const FUSION_MIN_GROUP = 4;

/** A combo survives this many consecutive non-clearing moves before resetting. */
export const COMBO_GRACE_MOVES = 3;

export const UNDOS_PER_GAME = 3;

export const POINTS = {
  perPlacedCell: 1,
  /** Line score for n lines in one move = lineBase * n * (n + 1) → 100, 300, 600, 1000... */
  lineBase: 50,
  /** Per cell, multiplied by the new level and the chain index. */
  fusionPerCellLevel: 5,
  /** Per cell of a max-level group that bursts, multiplied by chain index. */
  burstPerCell: 30,
  perfectClear: 300,
} as const;
