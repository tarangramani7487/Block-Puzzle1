import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { IconButton } from './Buttons';
import { CoinBadge } from './CoinBadge';

/** Back button, title and coin balance for secondary screens. */
export function ScreenHeader({ title, coins }: { title: string; coins: number }) {
  const router = useRouter();
  return (
    <View style={styles.row}>
      <IconButton icon="back" label="Back" size={40} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      <Text style={styles.title}>{title}</Text>
      <CoinBadge coins={coins} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { ...typography.title, flex: 1, color: colors.text },
});
