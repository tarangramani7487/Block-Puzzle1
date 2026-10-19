import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GameBlock } from '../components/GameBlock';
import { Icon } from '../components/Icon';
import { ScreenHeader } from '../components/ScreenHeader';
import { useGame } from '../hooks/GameProvider';
import { colors } from '../theme/colors';
import { ThemeProvider } from '../theme/ThemeContext';
import { THEMES, type Theme } from '../theme/themes';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const LEVELS = [1, 2, 3, 4, 5, 6];

function ThemeCard({ theme, owned, active, coins, onBuy, onSelect }: {
  theme: Theme;
  owned: boolean;
  active: boolean;
  coins: number;
  onBuy: () => void;
  onSelect: () => void;
}) {
  const affordable = coins >= theme.price;
  return (
    <View style={[styles.card, active && styles.cardActive]}>
      <ThemeProvider value={theme}>
        <View style={[styles.preview, { backgroundColor: theme.board, borderColor: theme.boardBorder }]}>
          {LEVELS.map((l) => (
            <GameBlock key={l} size={30} level={l} />
          ))}
        </View>
      </ThemeProvider>
      <View style={styles.footer}>
        <Text style={styles.name}>{theme.name}</Text>
        {active ? (
          <View style={[styles.action, styles.actionActive]}>
            <Icon name="check" size={16} color={colors.valid} />
            <Text style={[styles.actionText, { color: colors.valid }]}>IN USE</Text>
          </View>
        ) : owned ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`Use ${theme.name}`} onPress={onSelect} style={[styles.action, styles.actionUse]}>
            <Text style={styles.actionText}>USE</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Buy ${theme.name} for ${theme.price} coins`}
            disabled={!affordable}
            onPress={onBuy}
            style={[styles.action, affordable ? styles.actionBuy : styles.actionLocked]}
          >
            <Icon name={affordable ? 'coin' : 'lock'} size={16} color={affordable ? '#4A2C00' : colors.textMuted} />
            <Text style={[styles.actionText, { color: affordable ? '#4A2C00' : colors.textMuted }]}>{theme.price.toLocaleString()}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function ShopScreen() {
  const insets = useSafeAreaInsets();
  const { rewards, feedback } = useGame();
  const r = rewards.state;

  return (
    <View style={styles.root}>
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <ScreenHeader title="THEMES" coins={r.coins} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Text style={styles.hint}>Earn coins from daily goals, the daily puzzle and your login streak.</Text>
        {THEMES.map((t) => (
          <ThemeCard
            key={t.id}
            theme={t}
            owned={r.ownedThemes.includes(t.id)}
            active={r.activeTheme === t.id}
            coins={r.coins}
            onBuy={() => {
              rewards.buyTheme(t.id);
              feedback.play('fusion');
              feedback.vibrate('clear');
            }}
            onSelect={() => {
              rewards.selectTheme(t.id);
              feedback.play('place');
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBottom },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, backgroundColor: colors.header },
  content: { padding: spacing.lg, gap: spacing.md, width: '100%', maxWidth: 520, alignSelf: 'center' },
  hint: { ...typography.body, fontSize: 13, color: colors.textDim, textAlign: 'center' },
  card: {
    padding: spacing.md,
    gap: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.tray,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardActive: { borderColor: colors.valid },
  preview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 6,
    borderWidth: 2,
  },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { ...typography.title, fontSize: 18, color: colors.text },
  action: {
    minWidth: 96,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  actionActive: { backgroundColor: 'rgba(124,255,178,0.12)' },
  actionUse: { backgroundColor: colors.primary },
  actionBuy: { backgroundColor: colors.gold },
  actionLocked: { backgroundColor: 'rgba(0,0,0,0.3)' },
  actionText: { ...typography.label, fontSize: 13, letterSpacing: 0.5, color: colors.text },
});
