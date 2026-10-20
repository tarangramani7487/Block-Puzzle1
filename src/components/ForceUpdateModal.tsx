import { StyleSheet, Text } from 'react-native';

import { openStore } from '../utils/appUpdate';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { GameButton } from './Buttons';
import { ModalCard } from './ModalCard';

interface Props {
  requiredVersion: string;
  currentVersion: string;
}

export function ForceUpdateModal({ requiredVersion, currentVersion }: Props) {
  return (
    <ModalCard title="Update required">
      <Text style={styles.message}>
        A newer version of Block Puzzle is required to keep playing.
      </Text>
      <Text style={styles.versions}>
        You have {currentVersion} · Required {requiredVersion}
      </Text>
      <GameButton label="Update now" icon="play" variant="gold" onPress={openStore} />
    </ModalCard>
  );
}

const styles = StyleSheet.create({
  message: { ...typography.body, color: colors.text, textAlign: 'center' },
  versions: { ...typography.body, fontSize: 13, color: colors.textDim, textAlign: 'center' },
});
