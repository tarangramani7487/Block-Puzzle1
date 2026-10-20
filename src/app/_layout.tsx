import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ForceUpdateModal } from '../components/ForceUpdateModal';
import { LoadingScreen } from '../components/LoadingScreen';
import { GameProvider, useGame } from '../hooks/GameProvider';
import { colors } from '../theme/colors';
import { checkAppUpdate, type AppUpdateState } from '../utils/appUpdate';
// Initialises Firebase at launch so Analytics records the visit from the first screen.
import { setupCrashlytics } from '../utils/firebase';
import { setupNotifications } from '../utils/notifications';

// Enable Crashlytics and route uncaught JS errors to it before any screen renders.
setupCrashlytics();

// Keep the native splash up until the loading screen has drawn its first frame.
SplashScreen.preventAutoHideAsync();

/** Shows the loading screen over the app until saved progress is ready. */
function LaunchGate() {
  const { hydrated } = useGame();
  // Visitors opening the policy link should see it straight away.
  const skip = usePathname() === '/privacy-policy';
  const [loading, setLoading] = useState(true);
  const done = useCallback(() => {
    setLoading(false);
    // Ask for notifications only once the player can see the app.
    setupNotifications();
  }, []);
  useEffect(() => {
    if (skip) SplashScreen.hide();
  }, [skip]);
  if (skip) return null;
  return loading ? <LoadingScreen ready={hydrated} onDone={done} /> : null;
}

export default function RootLayout() {
  const [appUpdate, setAppUpdate] = useState<AppUpdateState | null>(null);
  useEffect(() => {
    // Remote-config check must not block launch; show the modal only if it answers "required".
    checkAppUpdate().then(setAppUpdate).catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bgBottom }}>
      <SafeAreaProvider>
        <GameProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: colors.bgBottom },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="game" options={{ gestureEnabled: false }} />
            <Stack.Screen name="daily" />
            <Stack.Screen name="shop" />
            <Stack.Screen name="tutorial" options={{ gestureEnabled: false }} />
            <Stack.Screen name="privacy-policy" />
          </Stack>
          <LaunchGate />
          {appUpdate?.required && (
            <ForceUpdateModal
              requiredVersion={appUpdate.requiredVersion}
              currentVersion={appUpdate.currentVersion}
            />
          )}
        </GameProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
