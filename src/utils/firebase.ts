import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import { getCrashlytics, recordError, setCrashlyticsCollectionEnabled } from '@react-native-firebase/crashlytics';

export type GameMode = 'classic' | 'daily';

export function logGameOver(mode: GameMode, score: number) {
  logEvent(getAnalytics(), 'game_over', { mode, score });
}

export function logError(e: Error) {
  recordError(getCrashlytics(), e);
}

// RN exposes ErrorUtils as a global for the JS error pipeline; it isn't on globalThis's type.
type ErrorHandler = (error: Error, isFatal?: boolean) => void;
interface ErrorUtils {
  getGlobalHandler(): ErrorHandler;
  setGlobalHandler(handler: ErrorHandler): void;
}

/** Enables Crashlytics and forwards uncaught JS errors to it. Call once at startup. */
export function setupCrashlytics() {
  const crashlytics = getCrashlytics();
  setCrashlyticsCollectionEnabled(crashlytics, true);

  const errorUtils = (globalThis as unknown as { ErrorUtils?: ErrorUtils }).ErrorUtils;
  if (!errorUtils) return;
  const previous = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error, isFatal) => {
    recordError(crashlytics, error);
    previous(error, isFatal);
  });
}
