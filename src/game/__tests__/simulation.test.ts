import { BOARD_SIZE, MAX_LEVEL } from '../constants';
import { applyMove, createInitialState } from '../gameEngine';
import { canAnyPieceFit } from '../gameOver';
import { findFullLines } from '../lineClearing';
import { canPlace } from '../placement';
import { Rng } from '../random';
import type { GameState } from '../types';

function randomValidMove(state: GameState, rng: Rng): [number, number, number] | null {
  const options: [number, number, number][] = [];
  state.tray.forEach((p, i) => {
    if (!p) return;
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++) if (canPlace(state.board, p.shapeId, r, c)) options.push([i, r, c]);
  });
  return options.length ? options[Math.floor(rng.next() * options.length)] : null;
}

describe('self-play invariants', () => {
  it('keeps the board, score and game-over state consistent over many random games', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const rng = new Rng(seed * 7919);
      let state = createInitialState(seed);
      for (let turn = 0; turn < 400 && !state.gameOver; turn++) {
        const mv = randomValidMove(state, rng);
        expect(mv).not.toBeNull(); // not game over ⇒ some move exists
        const out = applyMove(state, ...mv!);
        expect(out.ok).toBe(true);
        if (!out.ok) return;
        const next = out.state;
        expect(next.score).toBe(state.score + out.result.score.total);
        expect(next.board.flat().every((c) => Number.isInteger(c) && c >= 0 && c <= MAX_LEVEL)).toBe(true);
        expect(findFullLines(next.board)).toEqual({ rows: [], cols: [] });
        expect(next.gameOver).toBe(!canAnyPieceFit(next.board, next.tray));
        expect(next.tray.some((p) => p !== null)).toBe(true);
        state = next;
      }
    }
  });
});
