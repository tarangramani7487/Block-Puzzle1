import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import { getCrashlytics, recordError } from '@react-native-firebase/crashlytics';

export type GameMode = 'classic' | 'daily';

export function logGameOver(mode: GameMode, score: number) {
  logEvent(getAnalytics(), 'game_over', { mode, score });
}

export function logError(e: Error) {
  recordError(getCrashlytics(), e);
}
