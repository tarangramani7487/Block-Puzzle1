// Web build only: uses the Firebase JS SDK (React Native Firebase has no web support).
import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported, logEvent, type Analytics } from 'firebase/analytics';

export type GameMode = 'classic' | 'daily';

// Web config is public by design; access is controlled by Firebase security rules.
const firebaseConfig = {
  apiKey: 'AIzaSyC-qs0MTVByGLuFzEY8ayntfsjZ6sKipso',
  authDomain: 'block-puzzle-a90c5.firebaseapp.com',
  projectId: 'block-puzzle-a90c5',
  storageBucket: 'block-puzzle-a90c5.firebasestorage.app',
  messagingSenderId: '1056888628333',
  appId: '1:1056888628333:web:ab1a0817c6261072cbcb64',
  measurementId: 'G-14QE3G6L2W',
};

const app = initializeApp(firebaseConfig);

// Analytics only runs in a real browser (not during static rendering, or with cookies blocked).
const analytics: Promise<Analytics | null> = isSupported()
  .then((ok) => (ok ? getAnalytics(app) : null))
  .catch(() => null);

export function logGameOver(mode: GameMode, score: number) {
  analytics.then((a) => a && logEvent(a, 'game_over', { mode, score }));
}

// Crashlytics has no web SDK.
export function logError(_e: Error) {}
export function setupCrashlytics() {}
