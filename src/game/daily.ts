/**
 * Daily challenges and rewards: pure, deterministic rules.
 *
 * - Daily goals: three goals per calendar day, chosen from the date, so every
 *   player gets the same set. Progress comes from moves in any mode.
 * - Daily puzzle: a pre-filled board + tray seeded by the date, with a target
 *   score. Solving it once per day pays a fixed reward.
 * - Login streak: claiming on consecutive days walks a 7-day reward ladder.
 * - Coins unlock themes.
 */
import { getTheme, isKnownTheme, DEFAULT_THEME_ID } from '../theme/themes';
import { BOARD_SIZE, UNDOS_PER_GAME } from './constants';
import { createEmptyBoard } from './placement';
import { Rng } from './random';
import { generateTray } from './shapeGenerator';
import type { GameState, MoveResult } from './types';

// ---------- dates ----------

/** Local calendar day as 'YYYY-MM-DD'. */
export function dayKey(date: Date = new Date()): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

function shiftDay(day: string, delta: number): string {
  const [y, m, d] = day.split('-').map(Number);
  // Noon avoids DST edges turning one day shift into zero or two.
  return dayKey(new Date(y, m - 1, d + delta, 12));
}

/** Milliseconds until the next local midnight. */
export function msUntilTomorrow(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}

/** Stable 32-bit seed from a string (FNV-1a). */
export function seedFrom(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h | 0;
}

// ---------- goals ----------

export type GoalKind = 'lines' | 'combo' | 'fusions' | 'level' | 'score' | 'pieces' | 'multi';

export interface Goal {
  kind: GoalKind;
  target: number;
  reward: number;
  progress: number;
  claimed: boolean;
}

/** [target, reward] tiers per goal kind. */
const GOAL_TIERS: Record<GoalKind, readonly (readonly [number, number])[]> = {
  lines: [[10, 30], [15, 45], [20, 60]],
  combo: [[3, 40], [4, 60], [5, 80]],
  fusions: [[3, 40], [5, 60], [8, 80]],
  level: [[4, 30], [5, 50], [6, 80]],
  score: [[1500, 30], [2500, 50], [4000, 70]],
  pieces: [[40, 20], [60, 30], [80, 40]],
  multi: [[2, 40], [3, 55], [5, 80]],
};

export const GOALS_PER_DAY = 3;

export function goalLabel(goal: Pick<Goal, 'kind' | 'target'>): string {
  const n = goal.target.toLocaleString();
  switch (goal.kind) {
    case 'lines':
      return `Clear ${n} lines`;
    case 'combo':
      return `Reach a ×${n} combo`;
    case 'fusions':
      return `Fuse ${n} times`;
    case 'level':
      return `Fuse up to a level-${n} block`;
    case 'score':
      return `Score ${n} in one game`;
    case 'pieces':
      return `Place ${n} pieces`;
    case 'multi':
      return `Clear 2+ lines at once ${n} times`;
  }
}

export function dailyGoals(day: string): Goal[] {
  const rng = new Rng(seedFrom(`goals:${day}`));
  const kinds = Object.keys(GOAL_TIERS) as GoalKind[];
  const goals: Goal[] = [];
  while (goals.length < GOALS_PER_DAY) {
    const kind = kinds.splice(Math.floor(rng.next() * kinds.length), 1)[0];
    const tiers = GOAL_TIERS[kind];
    const [target, reward] = tiers[Math.floor(rng.next() * tiers.length)];
    goals.push({ kind, target, reward, progress: 0, claimed: false });
  }
  return goals;
}

export const isGoalDone = (g: Goal) => g.progress >= g.target;

/** Progress after one move. `state` is the game state after the move. */
export function advanceGoal(goal: Goal, result: MoveResult, state: GameState): Goal {
  if (isGoalDone(goal)) return goal;
  const lines = result.clearedRows.length + result.clearedCols.length;
  let progress = goal.progress;
  switch (goal.kind) {
    case 'lines':
      progress += lines;
      break;
    case 'combo':
      progress = Math.max(progress, result.combo);
      break;
    case 'fusions':
      progress += result.fusionSteps.filter((s) => s.toLevel !== null).length;
      break;
    case 'level':
      for (const s of result.fusionSteps) progress = Math.max(progress, s.toLevel ?? s.fromLevel);
      break;
    case 'score':
      progress = Math.max(progress, state.score);
      break;
    case 'pieces':
      progress += 1;
      break;
    case 'multi':
      if (lines >= 2) progress += 1;
      break;
  }
  return progress === goal.progress ? goal : { ...goal, progress: Math.min(progress, goal.target) };
}

// ---------- daily puzzle ----------

export const PUZZLE_REWARD = 150;

export interface DailyPuzzle {
  state: GameState;
  target: number;
}

/**
 * A partly filled board plus tray for the day. Rows are never full, so the
 * starting position has nothing to clear, and the tray generator guarantees a
 * piece that fits.
 */
export function createDailyPuzzle(day: string): DailyPuzzle {
  const rng = new Rng(seedFrom(`puzzle:${day}`));
  const board = createEmptyBoard(BOARD_SIZE);
  const level = () => 1 + Math.floor(rng.next() * 3);

  // A ragged pile in the bottom rows, denser towards the floor.
  for (let r = BOARD_SIZE - 4; r < BOARD_SIZE; r++) {
    const density = 0.35 + (r - (BOARD_SIZE - 4)) * 0.12;
    for (let c = 0; c < BOARD_SIZE; c++) if (rng.next() < density) board[r][c] = level();
  }
  // A few floating obstacles higher up.
  const obstacles = 3 + Math.floor(rng.next() * 4);
  for (let i = 0; i < obstacles; i++) {
    board[2 + Math.floor(rng.next() * 4)][Math.floor(rng.next() * BOARD_SIZE)] = level();
  }
  // Leave at least one gap in every row.
  for (const row of board) {
    if (row.every((cell) => cell !== 0)) row[Math.floor(rng.next() * BOARD_SIZE)] = 0;
  }

  const { tray, rngState, nextPieceId } = generateTray(board, rng.state, 1);
  const target = 1200 + Math.floor(rng.next() * 9) * 100;
  return {
    target,
    state: {
      version: 1,
      board,
      tray,
      score: 0,
      combo: 0,
      movesSinceClear: 0,
      moveCount: 0,
      nextPieceId,
      rngState,
      gameOver: false,
      undosLeft: UNDOS_PER_GAME,
      previous: null,
    },
  };
}

// ---------- rewards state ----------

export const STREAK_REWARDS = [20, 30, 40, 50, 60, 80, 150] as const;

/** Reward for the n-th consecutive day (1-based); the ladder repeats weekly. */
export const streakReward = (streak: number) => STREAK_REWARDS[(Math.max(1, streak) - 1) % STREAK_REWARDS.length];

export interface DailyProgress {
  day: string;
  goals: Goal[];
  puzzleSolved: boolean;
  puzzleClaimed: boolean;
}

export interface RewardsState {
  version: 1;
  coins: number;
  ownedThemes: string[];
  activeTheme: string;
  streak: number;
  /** Day the login bonus was last claimed. */
  lastLoginDay: string | null;
  daily: DailyProgress;
}

export function freshDaily(day: string): DailyProgress {
  return { day, goals: dailyGoals(day), puzzleSolved: false, puzzleClaimed: false };
}

export function createRewards(day: string): RewardsState {
  return {
    version: 1,
    coins: 0,
    ownedThemes: [DEFAULT_THEME_ID],
    activeTheme: DEFAULT_THEME_ID,
    streak: 0,
    lastLoginDay: null,
    daily: freshDaily(day),
  };
}

/** Starts a new day's goals and puzzle once the date changes. */
export function rollover(s: RewardsState, today: string): RewardsState {
  return s.daily.day === today ? s : { ...s, daily: freshDaily(today) };
}

export const loginPending = (s: RewardsState, today: string) => s.lastLoginDay !== today;

/** The streak the player would have after claiming today. */
export function streakIfClaimed(s: RewardsState, today: string): number {
  if (s.lastLoginDay === today) return s.streak;
  return s.lastLoginDay === shiftDay(today, -1) ? s.streak + 1 : 1;
}

export function claimLogin(s: RewardsState, today: string): RewardsState {
  if (!loginPending(s, today)) return s;
  const streak = streakIfClaimed(s, today);
  return { ...s, streak, lastLoginDay: today, coins: s.coins + streakReward(streak) };
}

export function recordMove(
  s: RewardsState,
  today: string,
  result: MoveResult,
  state: GameState,
  puzzleTarget?: number,
): RewardsState {
  const base = rollover(s, today);
  const goals = base.daily.goals.map((g) => advanceGoal(g, result, state));
  const solved = base.daily.puzzleSolved || (puzzleTarget !== undefined && state.score >= puzzleTarget);
  const changed = solved !== base.daily.puzzleSolved || goals.some((g, i) => g !== base.daily.goals[i]);
  return changed ? { ...base, daily: { ...base.daily, goals, puzzleSolved: solved } } : base;
}

export function claimGoal(s: RewardsState, index: number): RewardsState {
  const goal = s.daily.goals[index];
  if (!goal || goal.claimed || !isGoalDone(goal)) return s;
  const goals = s.daily.goals.map((g, i) => (i === index ? { ...g, claimed: true } : g));
  return { ...s, coins: s.coins + goal.reward, daily: { ...s.daily, goals } };
}

export function claimPuzzle(s: RewardsState): RewardsState {
  if (!s.daily.puzzleSolved || s.daily.puzzleClaimed) return s;
  return { ...s, coins: s.coins + PUZZLE_REWARD, daily: { ...s.daily, puzzleClaimed: true } };
}

/** Number of rewards waiting to be claimed (for badges). */
export function claimableCount(s: RewardsState, today: string): number {
  const d = s.daily.day === today ? s.daily : freshDaily(today);
  return (
    d.goals.filter((g) => isGoalDone(g) && !g.claimed).length +
    (d.puzzleSolved && !d.puzzleClaimed ? 1 : 0) +
    (loginPending(s, today) ? 1 : 0)
  );
}

export function buyTheme(s: RewardsState, id: string): RewardsState {
  if (!isKnownTheme(id) || s.ownedThemes.includes(id)) return s;
  const price = getTheme(id).price;
  if (s.coins < price) return s;
  return { ...s, coins: s.coins - price, ownedThemes: [...s.ownedThemes, id], activeTheme: id };
}

export function selectTheme(s: RewardsState, id: string): RewardsState {
  return s.ownedThemes.includes(id) && s.activeTheme !== id ? { ...s, activeTheme: id } : s;
}
