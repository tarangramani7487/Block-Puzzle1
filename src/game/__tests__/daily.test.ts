import {
  advanceGoal,
  buyTheme,
  claimableCount,
  claimGoal,
  claimLogin,
  claimPuzzle,
  createDailyPuzzle,
  createRewards,
  dailyGoals,
  dayKey,
  recordMove,
  rollover,
  selectTheme,
  streakIfClaimed,
  streakReward,
  type Goal,
} from '../daily';
import { applyMove } from '../gameEngine';
import { findFullLines } from '../lineClearing';
import { fitsAnywhere } from '../placement';
import type { GameState, MoveResult } from '../types';

const DAY = '2026-10-15';

function result(overrides: Partial<MoveResult> = {}): MoveResult {
  return {
    moveId: 1,
    piece: { id: 1, shapeId: 'dot', level: 1 },
    placedCells: [[0, 0]],
    clearedRows: [],
    clearedCols: [],
    clearedCells: [],
    fusionSteps: [],
    combo: 0,
    score: { placement: 1, lines: 0, fusion: 0, perfectClear: 0, total: 1 },
    perfectClear: false,
    trayRefilled: false,
    gameOver: false,
    ...overrides,
  };
}
const stateWithScore = (score: number) => ({ ...createDailyPuzzle(DAY).state, score }) as GameState;
const goal = (kind: Goal['kind'], target: number): Goal => ({ kind, target, reward: 10, progress: 0, claimed: false });

describe('dates', () => {
  it('formats local days', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('daily goals', () => {
  it('are deterministic per day and distinct in kind', () => {
    expect(dailyGoals(DAY)).toEqual(dailyGoals(DAY));
    const kinds = dailyGoals(DAY).map((g) => g.kind);
    expect(new Set(kinds).size).toBe(3);
    const days = ['2026-10-16', '2026-10-17', '2026-10-18'].map((d) => JSON.stringify(dailyGoals(d)));
    expect(new Set(days).size).toBeGreaterThan(1);
  });

  it('advance from move results and cap at the target', () => {
    const lines = result({ clearedRows: [1, 2], clearedCols: [3] });
    expect(advanceGoal(goal('lines', 10), lines, stateWithScore(0)).progress).toBe(3);
    expect(advanceGoal({ ...goal('lines', 2) }, lines, stateWithScore(0)).progress).toBe(2);
    expect(advanceGoal(goal('multi', 5), lines, stateWithScore(0)).progress).toBe(1);
    expect(advanceGoal(goal('combo', 4), result({ combo: 3 }), stateWithScore(0)).progress).toBe(3);
    expect(advanceGoal(goal('score', 1500), result(), stateWithScore(900)).progress).toBe(900);
    expect(advanceGoal(goal('pieces', 40), result(), stateWithScore(0)).progress).toBe(1);
    const fusion = result({
      fusionSteps: [
        { cells: [], fromLevel: 2, toLevel: 3, chainIndex: 1, points: 0 },
        { cells: [], fromLevel: 3, toLevel: 4, chainIndex: 2, points: 0 },
      ],
    });
    expect(advanceGoal(goal('fusions', 5), fusion, stateWithScore(0)).progress).toBe(2);
    expect(advanceGoal(goal('level', 5), fusion, stateWithScore(0)).progress).toBe(4);
  });
});

describe('daily puzzle', () => {
  it('is the same for everyone on a day, with nothing to clear and a playable tray', () => {
    for (const day of [DAY, '2026-02-28', '2027-07-04']) {
      const a = createDailyPuzzle(day);
      expect(createDailyPuzzle(day)).toEqual(a);
      const lines = findFullLines(a.state.board);
      expect(lines.rows.length + lines.cols.length).toBe(0);
      expect(a.state.tray.some((p) => p && fitsAnywhere(a.state.board, p.shapeId))).toBe(true);
      expect(a.target).toBeGreaterThanOrEqual(1200);
    }
  });

  it('is solved when the puzzle score reaches the target, then pays once', () => {
    const { target } = createDailyPuzzle(DAY);
    let r = recordMove(createRewards(DAY), DAY, result(), stateWithScore(target - 1), target);
    expect(r.daily.puzzleSolved).toBe(false);
    r = recordMove(r, DAY, result(), stateWithScore(target), target);
    expect(r.daily.puzzleSolved).toBe(true);
    // Classic games never solve the puzzle.
    expect(recordMove(createRewards(DAY), DAY, result(), stateWithScore(99999)).daily.puzzleSolved).toBe(false);
    r = claimPuzzle(r);
    expect(r.coins).toBe(150);
    expect(claimPuzzle(r).coins).toBe(150);
  });

  it('can be played with the real engine', () => {
    const { state } = createDailyPuzzle(DAY);
    const slot = state.tray.findIndex((p) => p && fitsAnywhere(state.board, p.shapeId));
    let moved = false;
    for (let r = 0; r < 10 && !moved; r++) for (let c = 0; c < 10 && !moved; c++) moved = applyMove(state, slot, r, c).ok;
    expect(moved).toBe(true);
  });
});

describe('rewards', () => {
  it('pays each goal once, only when complete', () => {
    let r = createRewards(DAY);
    expect(claimGoal(r, 0)).toBe(r);
    r = { ...r, daily: { ...r.daily, goals: r.daily.goals.map((g, i) => (i === 0 ? { ...g, progress: g.target } : g)) } };
    expect(claimableCount(r, DAY)).toBe(2); // the goal + the login bonus
    r = claimGoal(r, 0);
    expect(r.coins).toBe(r.daily.goals[0].reward);
    expect(claimGoal(r, 0).coins).toBe(r.coins);
  });

  it('tracks a login streak across consecutive days and resets after a gap', () => {
    let r = claimLogin(createRewards('2026-10-13'), '2026-10-13');
    expect(r.streak).toBe(1);
    expect(r.coins).toBe(streakReward(1));
    expect(claimLogin(r, '2026-10-13')).toBe(r);
    expect(streakIfClaimed(r, '2026-10-14')).toBe(2);
    r = claimLogin(r, '2026-10-14');
    expect(r.streak).toBe(2);
    expect(streakIfClaimed(r, '2026-10-20')).toBe(1);
    // Month boundary
    const endOfMonth = claimLogin(createRewards('2026-10-31'), '2026-10-31');
    expect(streakIfClaimed(endOfMonth, '2026-11-01')).toBe(2);
    expect(streakReward(8)).toBe(streakReward(1));
  });

  it('rolls over to a new set of goals on a new day', () => {
    const r = recordMove(createRewards(DAY), DAY, result({ clearedRows: [0] }), stateWithScore(10));
    const next = rollover(r, '2026-10-16');
    expect(next.daily.day).toBe('2026-10-16');
    expect(next.daily.goals.every((g) => g.progress === 0 && !g.claimed)).toBe(true);
    expect(rollover(next, '2026-10-16')).toBe(next);
  });

  it('buys themes only with enough coins and selects owned ones', () => {
    const poor = createRewards(DAY);
    expect(buyTheme(poor, 'candy')).toBe(poor);
    const rich = buyTheme({ ...poor, coins: 1000 }, 'candy');
    expect(rich.coins).toBe(700);
    expect(rich.ownedThemes).toContain('candy');
    expect(rich.activeTheme).toBe('candy');
    expect(buyTheme(rich, 'candy')).toBe(rich);
    expect(selectTheme(rich, 'jewel').activeTheme).toBe('jewel');
    expect(selectTheme(rich, 'neon')).toBe(rich);
  });
});
