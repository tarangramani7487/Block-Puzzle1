import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import * as Daily from '../game/daily';
import { createInitialState } from '../game/gameEngine';
import type { GameState, MoveResult } from '../game/types';
import { ThemeProvider } from '../theme/ThemeContext';
import { getTheme } from '../theme/themes';
import { DEFAULT_SETTINGS, type Settings } from '../utils/storage';
import { useFeedback } from './useFeedback';
import { useBoardController, type BoardController } from './useGame';
import { useAutoSave, useLoadPersisted } from './useGamePersistence';
import { useLatest } from './useLatest';
import { useToday } from './useToday';

export type GameMode = 'classic' | 'daily';

export interface RewardsApi {
  state: Daily.RewardsState;
  claimLogin: () => void;
  claimGoal: (index: number) => void;
  claimPuzzle: () => void;
  buyTheme: (id: string) => void;
  selectTheme: (id: string) => void;
}

interface GameContextValue {
  hydrated: boolean;
  today: string;
  best: number;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  feedback: ReturnType<typeof useFeedback>;
  classic: BoardController;
  daily: BoardController;
  /** Score needed to solve today's puzzle. */
  dailyTarget: number;
  rewards: RewardsApi;
}

const GameContext = createContext<GameContextValue | null>(null);

/** Shares the classic game, today's puzzle, rewards, settings and feedback across screens. */
export function GameProvider({ children }: { children: ReactNode }) {
  const today = useToday();
  const todayRef = useLatest(today);
  const [hydrated, setHydrated] = useState(false);
  const [best, setBest] = useState(0);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [storedRewards, setRewards] = useState(() => Daily.createRewards(today));
  // A new day brings new goals: derived here, persisted with the next change.
  const rewards = useMemo(() => Daily.rollover(storedRewards, today), [storedRewards, today]);

  const puzzle = useMemo(() => Daily.createDailyPuzzle(today), [today]);
  const puzzleRef = useLatest(puzzle);

  const classic = useBoardController(createInitialState, (result: MoveResult, state: GameState) => {
    setBest((b) => Math.max(b, state.score));
    setRewards((r) => Daily.recordMove(r, todayRef.current, result, state));
  });
  const daily = useBoardController(
    () => puzzleRef.current.state,
    (result: MoveResult, state: GameState) =>
      setRewards((r) => Daily.recordMove(r, todayRef.current, result, state, puzzleRef.current.target)),
  );

  useLoadPersisted(today, (p) => {
    // Never clobber a game the player already started while storage was loading.
    if (p.game && classic.game.moveCount === 0) classic.load(p.game);
    if (p.dailyGame?.day === today) daily.load(p.dailyGame.game);
    setBest((b) => Math.max(b, p.best));
    setSettings(p.settings);
    setRewards(p.rewards);
    setHydrated(true);
  });

  // A new day brings a new puzzle board. `dailyDay` is the day the loaded board belongs to.
  const dailyDay = useRef(today);
  const loadDaily = daily.load;
  useEffect(() => {
    if (dailyDay.current === today) return;
    dailyDay.current = today;
    loadDaily(puzzle.state);
  }, [today, puzzle, loadDaily]);

  const updateSettings = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);

  const rewardsApi: RewardsApi = useMemo(
    () => ({
      state: rewards,
      claimLogin: () => setRewards((r) => Daily.claimLogin(r, todayRef.current)),
      claimGoal: (i) => setRewards((r) => Daily.claimGoal(Daily.rollover(r, todayRef.current), i)),
      claimPuzzle: () => setRewards((r) => Daily.claimPuzzle(Daily.rollover(r, todayRef.current))),
      buyTheme: (id) => setRewards((r) => Daily.buyTheme(r, id)),
      selectTheme: (id) => setRewards((r) => Daily.selectTheme(r, id)),
    }),
    [rewards, todayRef],
  );

  useAutoSave(hydrated, { game: classic.game, dailyDay, dailyGame: daily.game, best, settings, rewards });

  const feedback = useFeedback(settings.sound, settings.haptics);
  const theme = getTheme(rewards.activeTheme);

  const value: GameContextValue = {
    hydrated,
    today,
    best,
    settings,
    updateSettings,
    feedback,
    classic,
    daily,
    dailyTarget: puzzle.target,
    rewards: rewardsApi,
  };

  return (
    <ThemeProvider value={theme}>
      <GameContext.Provider value={value}>{children}</GameContext.Provider>
    </ThemeProvider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}
