import { applyMove } from '../gameEngine';
import { canPlace, createEmptyBoard, fitsAnywhere, placeShape } from '../placement';
import { getShape } from '../shapes';
import { boardFrom, boardToStrings, emptyRows, piece, stateWith } from './helpers';

describe('placement', () => {
  it('places a valid piece and updates exactly its cells', () => {
    const state = stateWith(createEmptyBoard(), [piece('t1', 2), null, null]);
    const out = applyMove(state, 0, 3, 4);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const rows = boardToStrings(out.state.board);
    expect(rows[3]).toBe('....222...');
    expect(rows[4]).toBe('.....2....');
    expect(out.result.placedCells).toEqual([
      [3, 4],
      [3, 5],
      [3, 6],
      [4, 5],
    ]);
    expect(out.state.score).toBe(4);
  });

  it('rejects overlapping placement without modifying the board', () => {
    const board = boardFrom(['.1........', ...emptyRows(9)]);
    const state = stateWith(board, [piece('i2h'), null, null]);
    const out = applyMove(state, 0, 0, 0);
    expect(out).toEqual({ ok: false, reason: 'invalid-position' });
    expect(boardToStrings(state.board)[0]).toBe('.1........');
  });

  it('respects board boundaries on every side', () => {
    const board = createEmptyBoard();
    const i3h = getShape('i3h');
    expect(canPlace(board, i3h, 0, 7)).toBe(true);
    expect(canPlace(board, i3h, 0, 8)).toBe(false);
    expect(canPlace(board, i3h, -1, 0)).toBe(false);
    expect(canPlace(board, i3h, 0, -1)).toBe(false);
    expect(canPlace(board, getShape('i3v'), 7, 0)).toBe(true);
    expect(canPlace(board, getShape('i3v'), 8, 0)).toBe(false);
  });

  it('shape bounding-box holes do not block placement', () => {
    // t1 = ###/.#. ; its (1,0) hole may sit on an occupied cell.
    const board = boardFrom(emptyRows(1).concat(['3.........', ...emptyRows(8)]));
    expect(canPlace(board, getShape('t1'), 0, 0)).toBe(true);
  });

  it('rejects a missing tray slot', () => {
    const state = stateWith(createEmptyBoard(), [null, piece('dot'), null]);
    expect(applyMove(state, 0, 0, 0)).toEqual({ ok: false, reason: 'no-piece' });
  });

  it('placeShape throws on invalid placement', () => {
    expect(() => placeShape(createEmptyBoard(), getShape('i5h'), 0, 6, 1)).toThrow();
  });

  it('fitsAnywhere detects when a shape has no room', () => {
    const full = boardFrom(Array(10).fill('1.1.1.1.1.'));
    expect(fitsAnywhere(full, 'dot')).toBe(true);
    expect(fitsAnywhere(full, 'i2h')).toBe(false);
    expect(fitsAnywhere(full, 'i2v')).toBe(true);
  });
});
