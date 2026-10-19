import { memo, useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { DragShared } from '../hooks/useDragDrop';

const SIZE = 48;
/** One loop: fade in at the tray, glide to the target, fade out. */
const LOOP_MS = 2200;

interface Props {
  drag: DragShared;
  /** Tray slot the hand starts from. */
  slot: number;
  /** Target point in grid coordinates (px from the grid's top-left). */
  toX: number;
  toY: number;
}

/**
 * A pointing hand that repeatedly drags from a tray slot to a board spot.
 * Positions come from the drag layer's measured frames, so it lines up
 * with the real tray and board on any screen size.
 */
export const TutorialHand = memo(function TutorialHand({ drag, slot, toX, toY }: Props) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withRepeat(withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: LOOP_MS, easing: Easing.linear })), -1));
  }, [t]);

  const { frames, slots } = drag;
  const style = useAnimatedStyle(() => {
    const f = frames.get();
    const s = slots.get();
    // Not measured yet: stay hidden rather than flash in the corner.
    if (s[slot * 4 + 2] === 0) return { opacity: 0 };
    const fromX = s[slot * 4] + s[slot * 4 + 2] / 2 - f[0];
    const fromY = s[slot * 4 + 1] + s[slot * 4 + 3] / 2 - f[1];
    const endX = f[2] - f[0] + toX;
    const endY = f[3] - f[1] + toY;
    const p = t.get();
    const move = Easing.inOut(Easing.cubic)(Math.min(1, Math.max(0, (p - 0.15) / 0.55)));
    return {
      opacity: interpolate(p, [0, 0.1, 0.8, 0.95, 1], [0, 1, 1, 0, 0]),
      transform: [
        { translateX: fromX + (endX - fromX) * move - SIZE / 2 },
        { translateY: fromY + (endY - fromY) * move },
        // Press down before the drag, lift after the drop.
        { scale: interpolate(p, [0.05, 0.15, 0.7, 0.8], [1.1, 0.9, 0.9, 1.1], 'clamp') },
      ],
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[styles.hand, style]}>
      <Text style={styles.emoji}>👆</Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  hand: { position: 'absolute', left: 0, top: 0, width: SIZE, height: SIZE, zIndex: 50 },
  emoji: { fontSize: SIZE * 0.8, textAlign: 'center' },
});
