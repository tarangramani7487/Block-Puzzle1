import { useEffect, useRef, type RefObject } from 'react';

import type { RewardsState } from '../game/daily';
import type { GameState } from '../game/types';
import {
  clearDailyGame,
  clearSavedGame,
  loadAll,
  saveBest,
  saveDailyGame,
  saveGame,
  saveRewards,
  saveSettings,
  type PersistedData,
  type Settings,
} from '../utils/storage';
import { useLatest } from './useLatest';

/** Loads persisted data once on mount and hands it to `onLoaded`. */
export function useLoadPersisted(today: string, onLoaded: (data: PersistedData) => void) {
  const callback = useLatest(onLoaded);
  const day = useRef(today);
  useEffect(() => {
    let alive = true;
    loadAll(day.current).then((d) => {
      if (alive) callback.current(d);
    });
    return () => {
      alive = false;
    };
  }, [callback]);
}

/** Runs `effect` on changes after hydration, skipping the run that only reflects what was just loaded. */
function useSaveEffect(hydrated: boolean, effect: () => void, deps: unknown[]) {
  const skipFirst = useRef(true);
  const run = useLatest(effect);
  useEffect(() => {
    if (!hydrated) return;
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    run.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, run, ...deps]);
}

interface AutoSaveData {
  game: GameState;
  /** Day the daily board belongs to (read at save time). */
  dailyDay: RefObject<string>;
  dailyGame: GameState;
  best: number;
  settings: Settings;
  rewards: RewardsState;
}

/**
 * Writes changes back to storage after hydration. Finished or untouched games
 * are removed so the next launch starts fresh.
 */
export function useAutoSave(hydrated: boolean, d: AutoSaveData) {
  useSaveEffect(hydrated, () => (d.game.gameOver || d.game.moveCount === 0 ? clearSavedGame() : saveGame(d.game)), [d.game]);
  useSaveEffect(
    hydrated,
    () => (d.dailyGame.gameOver || d.dailyGame.moveCount === 0 ? clearDailyGame() : saveDailyGame(d.dailyDay.current, d.dailyGame)),
    [d.dailyGame],
  );
  useSaveEffect(hydrated, () => saveBest(d.best), [d.best]);
  useSaveEffect(hydrated, () => saveSettings(d.settings), [d.settings]);
  useSaveEffect(hydrated, () => saveRewards(d.rewards), [d.rewards]);
}
