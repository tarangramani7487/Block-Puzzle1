import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '../theme/colors';

const COUNT = 26;

/** Deterministic pseudo-random in [0,1). */
const hash = (n: number) => {
  const x = Math.sin(n * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const DOTS = Array.from({ length: COUNT }, (_, i) => ({
  left: `${Math.round(hash(i + 1) * 100)}%` as `${number}%`,
  top: `${Math.round(hash(i + 101) * 100)}%` as `${number}%`,
  size: 2 + Math.round(hash(i + 201) * 3),
  delay: Math.round(hash(i + 301) * 2400),
  duration: 1400 + Math.round(hash(i + 401) * 1600),
}));

const Dot = memo(function Dot({ left, top, size, delay, duration }: (typeof DOTS)[number]) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [t, delay, duration]);
  const style = useAnimatedStyle(() => ({ opacity: 0.15 + t.value * 0.75, transform: [{ scale: 0.6 + t.value * 0.6 }] }));
  return (
    <View style={[styles.pos, { left, top }]}>
      <Animated.View
        style={[styles.dot, { width: size, height: size, borderRadius: size, boxShadow: `0 0 ${size * 2}px ${colors.sparkle}` }, style]}
      />
    </View>
  );
});

/** Slowly twinkling background stars, purely decorative. */
export const Sparkles = memo(function Sparkles() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {DOTS.map((d, i) => (
        <Dot key={i} {...d} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  pos: { position: 'absolute' },
  dot: { backgroundColor: colors.sparkle },
});
