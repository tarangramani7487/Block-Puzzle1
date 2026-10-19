import { StyleSheet, Text, View } from 'react-native';

import { streakReward } from '../game/daily';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { GameButton } from './Buttons';
import { Icon } from './Icon';
import { ModalCard } from './ModalCard';
import { StreakStrip } from './StreakStrip';

interface Props {
  /** The streak the player gets by claiming today. */
  streak: number;
  onClaim: () => void;
}

export function LoginBonusModal({ streak, onClaim }: Props) {
  return (
    <ModalCard title="Daily bonus" onDismiss={onClaim}>
      <View style={styles.streak}>
        <Icon name="flame" size={22} color="#FF8A3D" />
        <Text style={styles.streakText}>
          {streak} day{streak === 1 ? '' : 's'} in a row
        </Text>
      </View>
      <StreakStrip streak={streak} claimedToday={false} />
      <Text style={styles.hint}>Come back every day for bigger rewards.</Text>
      <GameButton label={`Claim ${streakReward(streak)}`} icon="coin" variant="gold" onPress={onClaim} />
    </ModalCard>
  );
}

const styles = StyleSheet.create({
  streak: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  streakText: { ...typography.title, fontSize: 18, color: colors.text },
  hint: { ...typography.body, fontSize: 14, color: colors.textDim, textAlign: 'center' },
});
