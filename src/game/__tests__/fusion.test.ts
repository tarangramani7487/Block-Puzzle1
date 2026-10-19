import { applyMove } from '../gameEngine';
import { connectedGroup, resolveFusion } from '../fusion';
import { boardFrom, boardToStrings, emptyRows, piece, stateWith } from './helpers';

function move(rows: string[], shapeId: string, level: number, row: number, col: number) {
  const state = stateWith(boardFrom(rows), [piece(shapeId, level), piece('dot'), null]);
  const out = applyMove(state, 0, row, col);
  if (!out.ok) throw new Error(`move rejected: ${out.reason}`);
  return out;
}

describe('fusion', () => {
  it('fuses a piece with matching adjacent blocks into the next level', () => {
    const out = move(['11........', ...emptyRows(9)], 'i2h', 1, 0, 2);
    expect(boardToStrings(out.state.board)[0]).toBe('2222......');
    expect(out.result.fusionSteps).toEqual([
      { cells: [[0, 0], [0, 1], [0, 2], [0, 3]], fromLevel: 1, toLevel: 2, chainIndex: 1, points: 40 },
    ]);
    expect(out.result.score.fusion).toBe(40);
    expect(out.state.score).toBe(2 + 40);
  });

  it('does not fuse groups smaller than the minimum size', () => {
    const out = move(['1.........', ...emptyRows(9)], 'i2h', 1, 0, 1);
    expect(out.result.fusionSteps).toEqual([]);
    expect(boardToStrings(out.state.board)[0]).toBe('111.......');
  });

  it('a piece never fuses with itself alone', () => {
    const out = move(emptyRows(10), 'o3', 2, 0, 0);
    expect(out.result.fusionSteps).toEqual([]);
    expect(out.state.board[0][0]).toBe(2);
  });

  it('ignores different levels and diagonal neighbours', () => {
    const rows = ['22........', '..........', '...1......', ...emptyRows(7)];
    // i2h level 1 at (1,1),(1,2): (0,1) is level 2, (2,3) is diagonal only.
    const out = move(rows, 'i2h', 1, 1, 1);
    expect(out.result.fusionSteps).toEqual([]);
  });

  it('chains: an upgraded group fuses again with touching blocks of the new level', () => {
    const rows = ['11........', '2.........', ...emptyRows(8)];
    const out = move(rows, 'i2h', 1, 0, 2);
    const steps = out.result.fusionSteps;
    expect(steps).toHaveLength(2);
    expect(steps[0]).toMatchObject({ fromLevel: 1, toLevel: 2, chainIndex: 1, points: 4 * 2 * 5 * 1 });
    expect(steps[1]).toMatchObject({ fromLevel: 2, toLevel: 3, chainIndex: 2, points: 5 * 3 * 5 * 2 });
    expect(steps[1].cells).toHaveLength(5);
    expect(boardToStrings(out.state.board).slice(0, 2)).toEqual(['3333......', '3.........']);
    expect(out.result.score.fusion).toBe(40 + 150);
  });

  it('a max-level group bursts and is removed from the board', () => {
    const rows = ['55........', '6.........', ...emptyRows(8)];
    const out = move(rows, 'i2h', 5, 0, 2);
    const steps = out.result.fusionSteps;
    expect(steps).toEqual([
      { cells: [[0, 0], [0, 1], [0, 2], [0, 3]], fromLevel: 5, toLevel: 6, chainIndex: 1, points: 120 },
      { cells: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 0]], fromLevel: 6, toLevel: null, chainIndex: 2, points: 300 },
    ]);
    expect(out.state.board.flat().every((c) => c === 0)).toBe(true);
    expect(out.result.perfectClear).toBe(true);
  });

  it('line clearing resolves before fusion; only surviving placed cells seed fusion', () => {
    const rows = [...emptyRows(8), '22222222..', '.....111..'];
    // v3a = ##/#. at (8,8): fills (8,8),(8,9),(9,8). Row 8 completes and clears.
    const out = move(rows, 'v3a', 1, 8, 8);
    expect(out.result.clearedRows).toEqual([8]);
    expect(out.result.fusionSteps).toHaveLength(1);
    expect(out.result.fusionSteps[0].cells).toEqual([[9, 5], [9, 6], [9, 7], [9, 8]]);
    expect(out.result.fusionSteps[0].points).toBe(40);
    expect(boardToStrings(out.state.board).slice(8)).toEqual(['..........', '.....2222.']);
  });

  it('processes split groups independently in row-major order', () => {
    // Placed cells (0,0) and (2,0) are separate groups, each joined to existing 1s.
    const board = boardFrom(['1111......', '..........', '1111......', ...emptyRows(7)]);
    const { steps, board: next } = resolveFusion(board, [[0, 0], [2, 0]], 1);
    expect(steps.map((s) => s.cells[0])).toEqual([[0, 0], [2, 0]]);
    expect(boardToStrings(next).slice(0, 3)).toEqual(['2222......', '..........', '2222......']);
  });

  it('is deterministic for identical input', () => {
    const rows = ['11........', '2.........', ...emptyRows(8)];
    expect(move(rows, 'i2h', 1, 0, 2).result).toEqual(move(rows, 'i2h', 1, 0, 2).result);
  });

  it('connectedGroup returns same-level orthogonal neighbours only', () => {
    const board = boardFrom(['11.1......', '.1........', '..1.......', ...emptyRows(7)]);
    expect(connectedGroup(board, 0, 0)).toEqual([[0, 0], [0, 1], [1, 1]]);
    expect(connectedGroup(board, 0, 2)).toEqual([]);
  });
});
