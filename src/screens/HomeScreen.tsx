import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GameButton, IconButton } from '../components/Buttons';
import { CoinBadge } from '../components/CoinBadge';
import { GameBlock } from '../components/GameBlock';
import { Icon, type IconName } from '../components/Icon';
import { LoginBonusModal } from '../components/LoginBonusModal';
import { SettingsModal } from '../components/SettingsModal';
import { claimableCount, loginPending, streakIfClaimed } from '../game/daily';
import { useGame } from '../hooks/GameProvider';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

/** Logo mark: a 3×3 cluster of blocks. */
const LOGO: readonly (readonly number[])[] = [
  [1, 2, 3],
  [6, 6, 4],
  [5, 6, 2],
];

function MenuTile({ icon, label, badge, onPress }: { icon: IconName; label: string; badge?: number; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.8 }]}>
      <Icon name={icon} size={24} color={colors.text} />
      <Text style={styles.tileText}>{label}</Text>
      {!!badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { hydrated, today, classic, best, settings, updateSettings, rewards, feedback } = useGame();
  const { game, restart } = classic;
  const pendingLogin = hydrated && loginPending(rewards.state, today);
  const claimable = claimableCount(rewards.state, today);
  const [showSettings, setShowSettings] = useState(false);

  const logoCell = Math.min(64, width * 0.15, height * 0.075);
  const inProgress = game.moveCount > 0 && !game.gameOver;

  const play = () => {
    if (game.gameOver) restart();
    router.push('/game');
  };
  const newGame = () => {
    restart();
    router.push('/game');
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={StyleSheet.absoluteFill} />
      <View style={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.topBar}>
          <CoinBadge coins={rewards.state.coins} />
          <IconButton icon="gear" label="Settings" onPress={() => setShowSettings(true)} />
        </View>

        <View style={styles.hero}>
          <View style={[styles.logoGrid, { width: logoCell * 3 + 12, padding: 6 }]}>
            {LOGO.flatMap((row, r) =>
              row.map((level, c) => (
                <View key={`${r}-${c}`} style={{ padding: 2 }}>
                  <GameBlock level={level} size={logoCell - 4} />
                </View>
              )),
            )}
          </View>
          <Text style={styles.title}>BLOCK</Text>
          <Text style={[styles.title, styles.titleAccent]}>PUZZLE</Text>
          <View style={styles.ladder}>
            {[1, 2, 3, 4, 5, 6].map((l, i) => (
              <View key={l} style={styles.ladderItem}>
                <GameBlock size={20} level={l} plain />
                {i < 5 && <Text style={styles.arrow}>›</Text>}
              </View>
            ))}
          </View>
          <Text style={styles.tagline}>Clear lines. Fuse colours. Chain combos.</Text>
        </View>

        <View style={styles.actions}>
          <View style={styles.bestCard}>
            <Icon name="crown" size={20} color={colors.gold} />
            <Text style={styles.bestLabel}>BEST</Text>
            <Text style={styles.bestValue}>{best.toLocaleString()}</Text>
          </View>
          {!hydrated ? (
            <ActivityIndicator color={colors.text} size="large" style={{ marginVertical: 24 }} />
          ) : (
            <>
              <GameButton
                label={inProgress ? `Continue · ${game.score.toLocaleString()}` : 'Play'}
                icon="play"
                variant="gold"
                onPress={play}
                style={styles.playBtn}
              />
              {inProgress && <GameButton label="New game" icon="restart" variant="ghost" onPress={newGame} />}
              <View style={styles.tiles}>
                <MenuTile icon="calendar" label="Daily" badge={claimable} onPress={() => router.push('/daily')} />
                <MenuTile icon="palette" label="Themes" onPress={() => router.push('/shop')} />
              </View>
            </>
          )}
        </View>
      </View>

      {pendingLogin && !showSettings && (
        <LoginBonusModal
          streak={streakIfClaimed(rewards.state, today)}
          onClaim={() => {
            rewards.claimLogin();
            feedback.play('combo');
            feedback.vibrate('clear');
          }}
        />
      )}
      {showSettings && (
        <SettingsModal mode="home" settings={settings} onChangeSettings={updateSettings} onClose={() => setShowSettings(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBottom },
  content: { flex: 1, paddingHorizontal: spacing.xl, alignItems: 'center' },
  topBar: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tiles: { flexDirection: 'row', gap: spacing.md },
  tile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderBottomWidth: 4,
  },
  tileText: { ...typography.button, fontSize: 16, color: colors.text },
  badge: {
    position: 'absolute',
    top: -7,
    right: -5,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: colors.invalid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 12, fontWeight: '900', color: colors.text },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: radius.lg,
    backgroundColor: 'rgba(0,0,0,0.25)',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.hero,
    fontSize: 52,
    lineHeight: 56,
    color: colors.text,
    letterSpacing: 6,
    textShadowColor: 'rgba(124,92,255,0.8)',
    textShadowRadius: 20,
    textShadowOffset: { width: 0, height: 0 },
  },
  titleAccent: { color: colors.gold, textShadowColor: 'rgba(255,174,52,0.7)' },
  ladder: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, gap: 2 },
  ladderItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  arrow: { color: colors.textMuted, fontSize: 18, fontWeight: '900', marginHorizontal: 2 },
  tagline: { ...typography.body, color: colors.textDim, marginTop: spacing.md },
  actions: { width: '100%', maxWidth: 360, gap: spacing.md },
  bestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,209,102,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,209,102,0.25)',
    marginBottom: spacing.xs,
  },
  bestLabel: { ...typography.label, color: colors.textDim },
  bestValue: { ...typography.title, color: colors.gold, fontSize: 22 },
  playBtn: {},
});
