import { useCallback, useRef, useState } from 'react';

import { applyMove, canUndo, createInitialState, undoMove } from '../game/gameEngine';
import type { GameState, MoveOutcome, MoveResult } from '../game/types';
import { DEFAULT_SETTINGS, type Settings } from '../utils/storage';
import { useAutoSave, useLoadPersisted } from './useGamePersistence';

export interface GameController {
  hydrated: boolean;
  game: GameState;
  best: number;
  settings: Settings;
  /** Bumped when the board changes without a move (restart, undo, restore), so cells skip move animations. */
  boardEpoch: number;
  /** Result of the most recent move, for effects. Null after restart/undo. */
  lastResult: MoveResult | null;
  /** Synchronously applies a move. Safe against duplicate submissions. */
  place: (trayIndex: number, pieceId: number, row: number, col: number) => MoveOutcome;
  restart: () => void;
  undo: () => boolean;
  canUndo: boolean;
  updateSettings: (patch: Partial<Settings>) => void;
}

export function useGameController(): GameController {
  const [game, setGame] = useState<GameState>(() => createInitialState());
  const [best, setBest] = useState(0);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [lastResult, setLastResult] = useState<MoveResult | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [boardEpoch, setBoardEpoch] = useState(0);

  // The ref is the authoritative copy for synchronous validation, so two
  // rapid drops can never both apply against the same position.
  const gameRef = useRef(game);

  const commit = useCallback((next: GameState) => {
    gameRef.current = next;
    setGame(next);
  }, []);

  useLoadPersisted((persisted) => {
    // Never clobber a game the player already started while storage was loading.
    if (persisted.game && gameRef.current.moveCount === 0) {
      commit(persisted.game);
      setBoardEpoch((e) => e + 1);
    }
    setBest((b) => Math.max(b, persisted.best));
    setSettings(persisted.settings);
    setHydrated(true);
  });

  const place = useCallback(
    (trayIndex: number, pieceId: number, row: number, col: number): MoveOutcome => {
      const current = gameRef.current;
      if (current.tray[trayIndex]?.id !== pieceId) return { ok: false, reason: 'no-piece' };
      const out = applyMove(current, trayIndex, row, col);
      if (out.ok) {
        commit(out.state);
        setLastResult(out.result);
        setBest((b) => Math.max(b, out.state.score));
      }
      return out;
    },
    [commit],
  );

  const restart = useCallback(() => {
    commit(createInitialState());
    setBoardEpoch((e) => e + 1);
    setLastResult(null);
  }, [commit]);

  const undo = useCallback(() => {
    const current = gameRef.current;
    if (!canUndo(current)) return false;
    commit(undoMove(current));
    setBoardEpoch((e) => e + 1);
    setLastResult(null);
    return true;
  }, [commit]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  useAutoSave(hydrated, game, best, settings);

  return {
    hydrated,
    game,
    best,
    settings,
    boardEpoch,
    lastResult,
    place,
    restart,
    undo,
    canUndo: canUndo(game),
    updateSettings,
  };
}
