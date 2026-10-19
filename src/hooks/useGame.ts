import { useCallback, useRef, useState } from 'react';

import { applyMove, canUndo, undoMove } from '../game/gameEngine';
import type { GameState, MoveOutcome, MoveResult } from '../game/types';
import { useLatest } from './useLatest';

/** One playable board (classic game or daily puzzle). */
export interface BoardController {
  game: GameState;
  /** Bumped when the board changes without a move (restart, undo, restore), so cells skip move animations. */
  boardEpoch: number;
  /** Result of the most recent move, for effects. Null after restart/undo. */
  lastResult: MoveResult | null;
  /** Synchronously applies a move. Safe against duplicate submissions. */
  place: (trayIndex: number, pieceId: number, row: number, col: number) => MoveOutcome;
  restart: () => void;
  undo: () => boolean;
  canUndo: boolean;
  /** Replaces the position without animation (restore from storage, new day). */
  load: (state: GameState) => void;
}

export function useBoardController(
  makeInitial: () => GameState,
  onMove?: (result: MoveResult, state: GameState) => void,
): BoardController {
  const [game, setGame] = useState<GameState>(makeInitial);
  const [lastResult, setLastResult] = useState<MoveResult | null>(null);
  const [boardEpoch, setBoardEpoch] = useState(0);
  const makeInitialRef = useLatest(makeInitial);
  const onMoveRef = useLatest(onMove);

  // The ref is the authoritative copy for synchronous validation, so two
  // rapid drops can never both apply against the same position.
  const gameRef = useRef(game);

  const commit = useCallback((next: GameState) => {
    gameRef.current = next;
    setGame(next);
  }, []);

  const load = useCallback(
    (state: GameState) => {
      commit(state);
      setBoardEpoch((e) => e + 1);
      setLastResult(null);
    },
    [commit],
  );

  const place = useCallback(
    (trayIndex: number, pieceId: number, row: number, col: number): MoveOutcome => {
      const current = gameRef.current;
      if (current.tray[trayIndex]?.id !== pieceId) return { ok: false, reason: 'no-piece' };
      const out = applyMove(current, trayIndex, row, col);
      if (out.ok) {
        commit(out.state);
        setLastResult(out.result);
        onMoveRef.current?.(out.result, out.state);
      }
      return out;
    },
    [commit, onMoveRef],
  );

  const restart = useCallback(() => load(makeInitialRef.current()), [load, makeInitialRef]);

  const undo = useCallback(() => {
    const current = gameRef.current;
    if (!canUndo(current)) return false;
    load(undoMove(current));
    return true;
  }, [load]);

  return { game, boardEpoch, lastResult, place, restart, undo, canUndo: canUndo(game), load };
}
