import { COMBO_GRACE_MOVES, POINTS } from './constants';

export function placementPoints(cellCount: number): number {
  return cellCount * POINTS.perPlacedCell;
}

/**
 * Points for clearing `lines` lines in one move with the given combo count
 * (combo already includes this move). Multi-line clears grow quadratically:
 * 1 → 100, 2 → 300, 3 → 600, 4 → 1000; then multiplied by the combo.
 */
export function linePoints(lines: number, combo: number): number {
  if (lines <= 0) return 0;
  return POINTS.lineBase * lines * (lines + 1) * Math.max(1, combo);
}

/** Points for one fusion step. `toLevel === null` means a burst. */
export function fusionStepPoints(cells: number, toLevel: number | null, chainIndex: number): number {
  if (toLevel === null) return cells * POINTS.burstPerCell * chainIndex;
  return cells * toLevel * POINTS.fusionPerCellLevel * chainIndex;
}

export interface ComboState {
  combo: number;
  movesSinceClear: number;
}

/**
 * Combo rules: each move that clears at least one line increments the combo.
 * A move without a clear increments `movesSinceClear`; after
 * COMBO_GRACE_MOVES such moves in a row, the combo resets to 0.
 */
export function nextCombo(prev: ComboState, clearedLines: number): ComboState {
  if (clearedLines > 0) return { combo: prev.combo + 1, movesSinceClear: 0 };
  const movesSinceClear = prev.movesSinceClear + 1;
  return {
    combo: movesSinceClear >= COMBO_GRACE_MOVES ? 0 : prev.combo,
    movesSinceClear,
  };
}
