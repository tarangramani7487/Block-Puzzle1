import { memo, useEffect, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Icon } from './Icon';

interface Props {
  score: number;
  best: number;
  combo: number;
  compact?: boolean;
  /** Daily puzzle: show the target score instead of the best score. */
  target?: number;
  /** Button shown on the right (pause). */
  right?: ReactNode;
}

/** Arcade header: trophy + best on the left, score pill in the middle, action on the right. */
export const ScoreHeader = memo(function ScoreHeader({ score, best, combo, compact, target, right }: Props) {
  const shown = useAnimatedNumber(score);
  const bump = useSharedValue(1);

  useEffect(() => {
    if (score > 0) bump.value = withSequence(withTiming(1.12, { duration: 90 }), withSpring(1, { damping: 8 }));
  }, [score, bump]);

  const scoreStyle = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));
  const isBest = target === undefined ? score > 0 && score >= best : score >= target;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={[styles.side, styles.bestRow]}>
          <Icon name={target === undefined ? 'trophy' : 'target'} size={26} color={colors.gold} />
          <Text style={styles.bestText} numberOfLines={1}>
            {(target ?? Math.max(best, score)).toLocaleString()}
          </Text>
        </View>
        <View style={styles.pill}>
          <Animated.Text
            style={[styles.score, compact && { fontSize: 30 }, isBest && { color: colors.gold }, scoreStyle]}
            accessibilityLabel={`Score ${score}`}
          >
            {shown.toLocaleString()}
          </Animated.Text>
        </View>
        <View style={[styles.side, styles.right]}>{right}</View>
      </View>
      <View style={styles.comboSlot}>
        {combo >= 2 && (
          <Animated.View entering={ZoomIn.springify().damping(12)} exiting={FadeOut} style={styles.combo}>
            <Text style={styles.comboText}>COMBO ×{combo}</Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center' },
  row: { width: '100%', flexDirection: 'row', alignItems: 'center' },
  side: { flex: 1 },
  right: { alignItems: 'flex-end' },
  bestRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bestText: { ...typography.title, fontSize: 17, letterSpacing: 0.5, color: colors.textDim },
  pill: {
    minWidth: 110,
    paddingHorizontal: 18,
    paddingVertical: 4,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  score: { ...typography.score, color: colors.text },
  comboSlot: { height: 24, justifyContent: 'center', marginTop: 4 },
  combo: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
  },
  comboText: { ...typography.label, fontSize: 11, color: '#4A2C00' },
});
