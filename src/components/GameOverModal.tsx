import { StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { GameButton } from './Buttons';
import { Icon } from './Icon';
import { ModalCard } from './ModalCard';

interface Props {
  score: number;
  best: number;
  isNewBest: boolean;
  bestLabel?: string;
  replayLabel?: string;
  onReplay: () => void;
  onHome: () => void;
}

export function GameOverModal({ score, best, isNewBest, bestLabel = 'BEST', replayLabel = 'Play again', onReplay, onHome }: Props) {
  const shown = useAnimatedNumber(score, 900);
  return (
    <ModalCard title="No more moves">
      {isNewBest && (
        <Animated.View entering={ZoomIn.delay(500).springify().damping(10)} style={styles.badge}>
          <Icon name="crown" size={16} color="#4A2C00" />
          <Text style={styles.badgeText}>NEW BEST!</Text>
        </Animated.View>
      )}
      <View style={styles.scoreBox}>
        <Text style={styles.label}>SCORE</Text>
        <Text style={styles.score}>{shown.toLocaleString()}</Text>
        <View style={styles.bestRow}>
          <Icon name="crown" size={14} color={colors.gold} />
          <Text style={styles.best}>
            {bestLabel} {best.toLocaleString()}
          </Text>
        </View>
      </View>
      <GameButton label={replayLabel} icon="restart" variant="gold" onPress={onReplay} />
      <GameButton label="Home" icon="home" variant="ghost" onPress={onHome} />
    </ModalCard>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gold,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  badgeText: { ...typography.label, color: '#4A2C00' },
  scoreBox: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(0,0,0,0.22)',
    marginBottom: 4,
  },
  label: { ...typography.label, color: colors.textDim },
  score: { ...typography.score, fontSize: 52, color: colors.text },
  bestRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  best: { ...typography.label, color: colors.gold },
});
