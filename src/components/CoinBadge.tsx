import { memo, useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Icon } from './Icon';

/** Coin balance pill; counts up and bumps when coins are earned. */
export const CoinBadge = memo(function CoinBadge({ coins }: { coins: number }) {
  const shown = useAnimatedNumber(coins, 600);
  const bump = useSharedValue(1);
  useEffect(() => {
    bump.value = withSequence(withTiming(1.15, { duration: 110 }), withSpring(1, { damping: 8 }));
  }, [coins, bump]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));
  return (
    <Animated.View style={[styles.pill, style]} accessibilityLabel={`${coins} coins`}>
      <Icon name="coin" size={22} color={colors.gold} />
      <Text style={styles.text}>{shown.toLocaleString()}</Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 6,
    paddingRight: 14,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,209,102,0.35)',
  },
  text: { ...typography.title, fontSize: 17, letterSpacing: 0.5, color: colors.gold },
});
