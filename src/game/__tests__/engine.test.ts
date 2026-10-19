import { COMBO_GRACE_MOVES, TRAY_SIZE, UNDOS_PER_GAME } from '../constants';
import { applyMove, canUndo, createInitialState, undoMove } from '../gameEngine';
import { canAnyPieceFit, isGameOver } from '../gameOver';
import { createEmptyBoard, fitsAnywhere } from '../placement';
import { linePoints, nextCombo } from '../scoring';
import { generateTray } from '../shapeGenerator';
import { getShape, LARGE_SHAPE_CELLS } from '../shapes';
import { boardFrom, emptyRows, piece, stateWith } from './helpers';

describe('scoring and combos', () => {
  it('multi-line clears earn a growing bonus', () => {
    expect([1, 2, 3, 4].map((n) => linePoints(n, 1))).toEqual([100, 300, 600, 1000]);
    expect(linePoints(2, 3)).toBe(900);
    expect(linePoints(0, 5)).toBe(0);
  });

  it('combo grows on consecutive clears and resets after the grace period', () => {
    let c = { combo: 0, movesSinceClear: 0 };
    c = nextCombo(c, 1);
    c = nextCombo(c, 2);
    expect(c).toEqual({ combo: 2, movesSinceClear: 0 });
    for (let i = 1; i < COMBO_GRACE_MOVES; i++) c = nextCombo(c, 0);
    expect(c.combo).toBe(2);
    c = nextCombo(c, 0);
    expect(c.combo).toBe(0);
  });

  it('applies the combo multiplier to consecutive clears in the engine', () => {
    const board = boardFrom(['111111111.', '111111111.', ...emptyRows(8)]);
    let state = stateWith(board, [piece('dot', 2, 1), piece('dot', 3, 2), piece('i5h', 1, 3)]);
    let out = applyMove(state, 0, 0, 9);
    if (!out.ok) throw new Error();
    expect(out.result.combo).toBe(1);
    expect(out.result.score.lines).toBe(100);
    state = out.state;
    out = applyMove(state, 1, 1, 9);
    if (!out.ok) throw new Error();
    expect(out.result.combo).toBe(2);
    expect(out.result.score.lines).toBe(200);
  });
});

describe('tray generation', () => {
  it('creates three distinct pieces with at most one large shape', () => {
    for (let seed = 1; seed < 300; seed++) {
      const { tray } = generateTray(createEmptyBoard(), seed, 1);
      expect(tray).toHaveLength(TRAY_SIZE);
      expect(new Set(tray.map((p) => p.shapeId)).size).toBe(TRAY_SIZE);
      const large = tray.filter((p) => getShape(p.shapeId).cells.length >= LARGE_SHAPE_CELLS);
      expect(large.length).toBeLessThanOrEqual(1);
      tray.forEach((p) => expect(p.level).toBeGreaterThanOrEqual(1));
    }
  });

  it('is deterministic for a given rng state and assigns increasing ids', () => {
    const a = generateTray(createEmptyBoard(), 1234, 7);
    const b = generateTray(createEmptyBoard(), 1234, 7);
    expect(a).toEqual(b);
    expect(a.tray.map((p) => p.id)).toEqual([7, 8, 9]);
    expect(a.nextPieceId).toBe(10);
  });

  it('always offers at least one fitting piece on a crowded board', () => {
    // Only single isolated holes are free.
    const crowded = boardFrom(Array.from({ length: 10 }, (_, r) => (r % 2 ? '111111111.' : '1111.11111')));
    for (let seed = 1; seed < 100; seed++) {
      const { tray } = generateTray(crowded, seed, 1);
      expect(tray.some((p) => fitsAnywhere(crowded, p.shapeId))).toBe(true);
    }
  });

  it('replaces the tray only after all three pieces are placed', () => {
    let state = stateWith(createEmptyBoard(), [piece('dot', 1, 1), piece('dot', 2, 2), piece('dot', 3, 3)], {
      nextPieceId: 4,
    });
    for (const [i, col] of [[0, 0], [1, 3], [2, 6]] as const) {
      const out = applyMove(state, i, 0, col);
      if (!out.ok) throw new Error();
      state = out.state;
      if (i < 2) {
        expect(out.result.trayRefilled).toBe(false);
        expect(state.tray.filter((p) => p !== null)).toHaveLength(2 - i);
      } else {
        expect(out.result.trayRefilled).toBe(true);
        expect(state.tray.every((p) => p !== null)).toBe(true);
        expect(state.tray.map((p) => p!.id)).toEqual([4, 5, 6]);
      }
    }
  });
});

describe('game over', () => {
  // Checkerboard: no two orthogonally adjacent empty cells.
  const checker = boardFrom(Array.from({ length: 10 }, (_, r) => (r % 2 ? '.1.1.1.1.1' : '1.1.1.1.1.')));

  it('is game over when no remaining piece fits', () => {
    expect(isGameOver(checker, [piece('i2h'), null, piece('o2')])).toBe(true);
  });

  it('is not game over if any one piece still fits', () => {
    expect(canAnyPieceFit(checker, [piece('i2h'), piece('dot'), piece('o2')])).toBe(true);
    expect(isGameOver(checker, [piece('i2h'), piece('dot'), piece('o2')])).toBe(false);
  });

  it('the engine flags game over after a move and rejects further moves', () => {
    const state = stateWith(checker, [piece('dot', 1), piece('i2h'), null]);
    const out = applyMove(state, 0, 0, 1);
    if (!out.ok) throw new Error();
    expect(out.state.gameOver).toBe(true);
    expect(out.result.gameOver).toBe(true);
    expect(applyMove(out.state, 1, 5, 5)).toEqual({ ok: false, reason: 'game-over' });
  });
});

describe('restart and undo', () => {
  it('a new game starts empty with a full tray and zero score', () => {
    const s = createInitialState(99);
    expect(s.board.flat().every((c) => c === 0)).toBe(true);
    expect(s.tray.every((p) => p !== null)).toBe(true);
    expect(s).toMatchObject({ score: 0, combo: 0, moveCount: 0, gameOver: false, undosLeft: UNDOS_PER_GAME, previous: null });
  });

  it('undo restores the exact previous position and consumes a charge', () => {
    const start = createInitialState(5);
    const out = applyMove(start, 0, 0, 0);
    if (!out.ok) throw new Error();
    expect(canUndo(out.state)).toBe(true);
    const undone = undoMove(out.state);
    expect(undone.board).toEqual(start.board);
    expect(undone.tray).toEqual(start.tray);
    expect(undone.score).toBe(0);
    expect(undone.undosLeft).toBe(UNDOS_PER_GAME - 1);
    expect(canUndo(undone)).toBe(false);
    expect(undoMove(undone)).toBe(undone);
  });
});
