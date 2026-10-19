import { createContext, useContext, type ReactNode } from 'react';

import { useFeedback } from './useFeedback';
import { useGameController, type GameController } from './useGame';

type GameContextValue = GameController & { feedback: ReturnType<typeof useFeedback> };

const GameContext = createContext<GameContextValue | null>(null);

/** Shares one game, its settings and feedback players across screens. */
export function GameProvider({ children }: { children: ReactNode }) {
  const controller = useGameController();
  const feedback = useFeedback(controller.settings.sound, controller.settings.haptics);
  return <GameContext.Provider value={{ ...controller, feedback }}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}
