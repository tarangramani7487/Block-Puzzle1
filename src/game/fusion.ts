/**
 * FUSION RULES
 * ============
 * Every block has a fusion level 1..MAX_LEVEL (shown by colour and pips).
 * Fusion runs once per move, AFTER line clearing, on the authoritative board.
 *
 * 1. Seeds: the cells of the piece just placed that survived line clearing,
 *    visited in row-major order (top-to-bottom, left-to-right).
 * 2. For each seed that still holds the piece's level and has not already
 *    been part of a fusion this move, take its connected group: all cells
 *    of that same level reachable through up/down/left/right neighbours.
 * 3. The group FUSES when both are true:
 *      a. it has at least FUSION_MIN_GROUP cells, and
 *      b. it contains at least one block that was already on the board
 *         (a piece never fuses with itself alone).
 * 4. Fusing upgrades every cell in the group by one level (chain step 1).
 * 5. Chain: after an upgrade to level L+1, if the group now touches any other
 *    block of level L+1, the whole connected L+1 group (old group + touching
 *    blocks) upgrades again (chain step 2), and so on.
 * 6. Burst: when a group at MAX_LEVEL would fuse, it bursts instead — all of
 *    its cells are removed from the board and award burst points. A burst
 *    ends that chain.
 * 7. Fusion never changes occupancy except through bursts, so it cannot
 *    complete new lines; line clearing is not re-run afterwards.
 *
 * Scoring per step (see scoring.ts): upgrade = cells × newLevel × 5 × chainIndex,
 * burst = cells × 30 × chainIndex.
 */
import { FUSION_MIN_GROUP, MAX_LEVEL } from './constants';
import { cloneBoard, isInside } from './placement';
import { fusionStepPoints } from './scoring';
import type { Board, Coord, FusionStep } from './types';

const NEIGHBOURS: readonly Coord[] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

const key = (r: number, c: number) => r * 1000 + c;

/** Connected group of cells sharing the level at (row, col), 4-neighbourhood. */
export function connectedGroup(board: Board, row: number, col: number): Coord[] {
  const level = board[row][col];
  if (level === 0) return [];
  const seen = new Set<number>([key(row, col)]);
  const stack: Coord[] = [[row, col]];
  const group: Coord[] = [];
  while (stack.length) {
    const [r, c] = stack.pop()!;
    group.push([r, c]);
    for (const [dr, dc] of NEIGHBOURS) {
      const nr = r + dr;
      const nc = c + dc;
      if (isInside(board, nr, nc) && board[nr][nc] === level && !seen.has(key(nr, nc))) {
        seen.add(key(nr, nc));
        stack.push([nr, nc]);
      }
    }
  }
  // Row-major order keeps results deterministic regardless of traversal order.
  return group.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

export interface FusionResult {
  board: Board;
  steps: FusionStep[];
}

/**
 * Resolves fusion for one move.
 * @param board board after placement and line clearing
 * @param placedCells absolute cells of the placed piece (cleared ones are ignored)
 * @param pieceLevel the level the piece was placed at
 */
export function resolveFusion(board: Board, placedCells: readonly Coord[], pieceLevel: number): FusionResult {
  const current = cloneBoard(board);
  const steps: FusionStep[] = [];
  const placedKeys = new Set(placedCells.map(([r, c]) => key(r, c)));
  const consumed = new Set<number>();

  const seeds = [...placedCells].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  for (const [sr, sc] of seeds) {
    if (consumed.has(key(sr, sc)) || current[sr][sc] !== pieceLevel) continue;

    let group = connectedGroup(current, sr, sc);
    group.forEach(([r, c]) => consumed.add(key(r, c)));

    const touchesExisting = group.some(([r, c]) => !placedKeys.has(key(r, c)));
    if (group.length < FUSION_MIN_GROUP || !touchesExisting) continue;

    let level = pieceLevel;
    let chainIndex = 1;
    while (true) {
      if (level >= MAX_LEVEL) {
        for (const [r, c] of group) current[r][c] = 0;
        steps.push({
          cells: group,
          fromLevel: level,
          toLevel: null,
          chainIndex,
          points: fusionStepPoints(group.length, null, chainIndex),
        });
        break;
      }

      const toLevel = level + 1;
      for (const [r, c] of group) current[r][c] = toLevel;
      steps.push({
        cells: group,
        fromLevel: level,
        toLevel,
        chainIndex,
        points: fusionStepPoints(group.length, toLevel, chainIndex),
      });

      const grown = connectedGroup(current, group[0][0], group[0][1]);
      if (grown.length === group.length) break;
      grown.forEach(([r, c]) => consumed.add(key(r, c)));
      group = grown;
      level = toLevel;
      chainIndex++;
    }
  }

  return { board: current, steps };
}
