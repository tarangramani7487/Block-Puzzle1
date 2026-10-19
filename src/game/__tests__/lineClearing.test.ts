import { applyMove } from '../gameEngine';
import { clearLines, findFullLines } from '../lineClearing';
import { boardFrom, boardToStrings, emptyRows, piece, stateWith } from './helpers';

describe('line clearing', () => {
  it('clears a completed horizontal row', () => {
    const board = boardFrom(['12121212..', ...emptyRows(4), '...3......', ...emptyRows(4)]);
    const state = stateWith(board, [piece('i2h', 3), piece('dot'), null]);
    const out = applyMove(state, 0, 0, 8);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.clearedRows).toEqual([0]);
    expect(out.result.clearedCols).toEqual([]);
    expect(boardToStrings(out.state.board)[0]).toBe('..........');
    expect(out.result.clearedCells).toHaveLength(10);
    // 2 placed + 100 for one line (combo 1)
    expect(out.result.score.lines).toBe(100);
    expect(out.state.score).toBe(102);
  });

  it('clears a completed vertical column', () => {
    const rows = emptyRows(10).map((_, r) => (r < 8 ? '2.........' : '..........'));
    const state = stateWith(boardFrom(rows), [piece('i2v', 1), piece('dot'), null]);
    const out = applyMove(state, 0, 8, 0);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.clearedCols).toEqual([0]);
    expect(out.state.board.every((row) => row[0] === 0)).toBe(true);
  });

  it('clears multiple rows and columns in the same move without double-counting', () => {
    // Row 0 and column 0 both complete when the dot lands on (0,0).
    const rows = ['.212121212', ...Array(9).fill('2.........')];
    const state = stateWith(boardFrom(rows), [piece('dot', 3), piece('dot'), null]);
    const out = applyMove(state, 0, 0, 0);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.clearedRows).toEqual([0]);
    expect(out.result.clearedCols).toEqual([0]);
    expect(out.result.clearedCells).toHaveLength(19);
    expect(out.state.board.flat().every((c) => c === 0)).toBe(true);
    // 2 lines → 300, plus a perfect clear bonus
    expect(out.result.score.lines).toBe(300);
    expect(out.result.perfectClear).toBe(true);
  });

  it('clears two parallel rows at once', () => {
    const board = boardFrom(['1111111.11', '2222222.22', ...emptyRows(8)]);
    const { rows, cols } = findFullLines(board);
    expect(rows).toEqual([]);
    expect(cols).toEqual([]);
    const state = stateWith(board, [piece('i2v', 3), piece('dot'), null]);
    const out = applyMove(state, 0, 0, 7);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.clearedRows).toEqual([0, 1]);
    expect(boardToStrings(out.state.board).slice(0, 2)).toEqual(['..........', '..........']);
  });

  it('clearLines leaves other cells untouched', () => {
    const board = boardFrom(['1111111111', '3.........', ...emptyRows(8)]);
    const { board: next } = clearLines(board, findFullLines(board));
    expect(boardToStrings(next)[1]).toBe('3.........');
  });
});
