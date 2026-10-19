import { memo, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../theme/ThemeContext';
import { themeLevel } from '../theme/themes';
import { GameBlock } from './GameBlock';

interface Props {
  level: number;
  size: number;
  left: number;
  top: number;
  /** Changes on restart/undo/restore: the new level appears without animation. */
  epoch: number;
}

/**
 * One occupied-or-empty board slot. Memoised on primitive props so a move
 * only re-renders the cells whose level actually changed.
 * - empty → filled: pop-in
 * - level change: fusion pulse with a coloured glow
 */
export const BoardCell = memo(function BoardCell({ level, size, left, top, epoch }: Props) {
  const prev = useRef(level);
  const prevEpoch = useRef(epoch);
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);
  const theme = useTheme();

  useEffect(() => {
    const before = prev.current;
    const sameEpoch = prevEpoch.current === epoch;
    prev.current = level;
    prevEpoch.current = epoch;
    if (!sameEpoch || level === 0 || before === level) return;
    if (before === 0) {
      scale.value = withSequence(withTiming(0.72, { duration: 0 }), withSpring(1, { damping: 10, stiffness: 320 }));
    } else {
      scale.value = withSequence(withTiming(1.22, { duration: 140 }), withSpring(1, { damping: 7, stiffness: 260 }));
      glow.value = withSequence(withTiming(1, { duration: 120 }), withTiming(0, { duration: 520 }));
    }
  }, [level, epoch, scale, glow]);

  const blockStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value, transform: [{ scale: 1 + glow.value * 0.35 }] }));

  if (level === 0) return null;
  const palette = themeLevel(theme, level);
  return (
    <Animated.View style={[styles.cell, { left, top, width: size, height: size }, blockStyle]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.glow, { borderRadius: size * 0.12, backgroundColor: palette.glow }, glowStyle]}
      />
      <GameBlock size={size} level={level} />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  cell: { position: 'absolute' },
  glow: { ...StyleSheet.absoluteFill, margin: -4 },
});
