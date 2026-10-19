import { useEffect, useRef } from 'react';

import type { GameState } from '../game/types';
import {
  clearSavedGame,
  DEFAULT_SETTINGS,
  loadAll,
  saveBest,
  saveGame,
  saveSettings,
  type PersistedData,
  type Settings,
} from '../utils/storage';
import { useLatest } from './useLatest';

/** Loads persisted data once on mount and hands it to `onLoaded`. */
export function useLoadPersisted(onLoaded: (data: PersistedData) => void) {
  const callback = useLatest(onLoaded);
  useEffect(() => {
    let alive = true;
    loadAll()
      .catch((): PersistedData => ({ best: 0, settings: { ...DEFAULT_SETTINGS }, game: null }))
      .then((d) => {
        if (alive) callback.current(d);
      });
    return () => {
      alive = false;
    };
  }, [callback]);
}

/**
 * Writes changes back to storage after hydration. Games that are over are
 * removed so the next launch starts fresh.
 */
export function useAutoSave(hydrated: boolean, game: GameState, best: number, settings: Settings) {
  const skipFirst = useRef(true);

  useEffect(() => {
    if (!hydrated) return;
    // The first run after hydration only reflects what was just loaded.
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    if (game.gameOver || game.moveCount === 0) clearSavedGame();
    else saveGame(game);
  }, [hydrated, game]);

  useEffect(() => {
    if (hydrated) saveBest(best);
  }, [hydrated, best]);

  useEffect(() => {
    if (hydrated) saveSettings(settings);
  }, [hydrated, settings]);
}
