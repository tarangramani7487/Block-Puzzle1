import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

/** Matches the native splash (app.json) so the hand-off is seamless. */
const SPLASH_BG = '#14112B';
const LOGO_SIZE = 180;
const MIN_DURATION_MS = 2500;
const FADE_MS = 300;

interface Props {
  /** True once saved progress has loaded; the screen stays up until then. */
  ready: boolean;
  onDone: () => void;
}

/** Branded launch screen with a progress bar, shown for at least 2.5s. */
export function LoadingScreen({ ready, onDone }: Props) {
  const [minElapsed, setMinElapsed] = useState(false);
  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    progress.set(withTiming(0.9, { duration: MIN_DURATION_MS, easing: Easing.out(Easing.quad) }));
    const t = setTimeout(() => setMinElapsed(true), MIN_DURATION_MS);
    return () => clearTimeout(t);
  }, [progress]);

  useEffect(() => {
    if (!minElapsed || !ready) return;
    progress.set(withTiming(1, { duration: 150 }));
    opacity.set(
      withTiming(0, { duration: FADE_MS }, (finished) => {
        'worklet';
        if (finished) scheduleOnRN(onDone);
      }),
    );
  }, [minElapsed, ready, progress, opacity, onDone]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  const barStyle = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));

  return (
    <Animated.View style={[styles.root, fadeStyle]} onLayout={() => SplashScreen.hide()}>
      <Image source={require('../../assets/splash-icon.png')} style={styles.logo} resizeMode="contain" />
      <View style={styles.footer}>
        <Text style={styles.title}>BLOCK PUZZLE</Text>
        <View style={styles.track}>
          <Animated.View style={[styles.bar, barStyle]} />
        </View>
        <Text style={styles.hint}>Loading…</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: SPLASH_BG,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  logo: { width: LOGO_SIZE, height: LOGO_SIZE },
  footer: { position: 'absolute', bottom: '14%', left: 0, right: 0, alignItems: 'center' },
  title: { ...typography.title, color: colors.text, marginBottom: 16 },
  track: {
    width: '60%',
    maxWidth: 280,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  bar: { height: '100%', borderRadius: 4, backgroundColor: colors.gold },
  hint: { ...typography.label, color: colors.textDim, marginTop: 12 },
});
