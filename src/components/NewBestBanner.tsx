import { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';

import { BOARD_SIZE } from '../game/constants';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { BoardGeometry } from './GameBoard';
import { Icon } from './Icon';

/** How long the banner stays on screen, including its fade-out. */
export const NEW_BEST_MS = 1900;

/** Gold "NEW BEST!" pop shown over the board when the score beats the record. */
export const NewBestBanner = memo(function NewBestBanner({ geo, score }: { geo: BoardGeometry; score: number }) {
  const pop = useSharedValue(0);
  const fade = useSharedValue(1);
  useEffect(() => {
    pop.set(withSpring(1, { damping: 9, stiffness: 200 }));
    fade.set(withDelay(NEW_BEST_MS - 350, withTiming(0, { duration: 300 })));
  }, [pop, fade]);

  const style = useAnimatedStyle(() => ({
    opacity: fade.get(),
    transform: [{ scale: 0.4 + pop.get() * 0.6 }, { translateY: (1 - fade.get()) * -16 }],
  }));

  const span = geo.pitch * BOARD_SIZE;
  return (
    <Animated.View pointerEvents="none" style={[styles.wrap, { width: span, top: span * 0.1 }, style]}>
      <View style={styles.badge}>
        <Icon name="crown" size={26} color="#4A2C00" />
        <Text style={styles.title}>NEW BEST!</Text>
      </View>
      <Text style={styles.score}>{score.toLocaleString()}</Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, alignItems: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: '#FFF1C2',
  },
  title: { ...typography.hero, fontSize: 28, color: '#4A2C00' },
  score: {
    ...typography.title,
    fontSize: 22,
    color: colors.gold,
    marginTop: spacing.xs,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 2 },
  },
});
