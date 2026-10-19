import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { STREAK_REWARDS } from '../game/daily';
import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Icon } from './Icon';

interface Props {
  /** Streak count including today if claimed (or the streak today's claim would give). */
  streak: number;
  /** Whether today's reward is already collected. */
  claimedToday: boolean;
}

/** The 7-day reward ladder, with collected days checked and today highlighted. */
export const StreakStrip = memo(function StreakStrip({ streak, claimedToday }: Props) {
  const position = (Math.max(1, streak) - 1) % STREAK_REWARDS.length; // today's slot
  return (
    <View style={styles.row}>
      {STREAK_REWARDS.map((reward, i) => {
        const collected = i < position || (i === position && claimedToday);
        const isToday = i === position;
        return (
          <View key={i} style={[styles.day, collected && styles.collected, isToday && styles.today]}>
            <Text style={styles.dayLabel}>DAY {i + 1}</Text>
            {collected ? (
              <Icon name="check" size={18} color={colors.valid} />
            ) : (
              <Icon name={i === STREAK_REWARDS.length - 1 ? 'gift' : 'coin'} size={18} color={colors.gold} />
            )}
            <Text style={styles.reward}>{reward}</Text>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  collected: { backgroundColor: 'rgba(124,255,178,0.12)' },
  today: { borderColor: colors.gold, backgroundColor: 'rgba(255,209,102,0.16)' },
  dayLabel: { ...typography.label, fontSize: 8, letterSpacing: 0.5, color: colors.textDim },
  reward: { ...typography.label, fontSize: 11, letterSpacing: 0, color: colors.text },
});
