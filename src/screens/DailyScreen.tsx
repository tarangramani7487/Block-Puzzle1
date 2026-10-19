import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GameButton } from '../components/Buttons';
import { Icon } from '../components/Icon';
import { MiniBoard } from '../components/MiniBoard';
import { ScreenHeader } from '../components/ScreenHeader';
import { StreakStrip } from '../components/StreakStrip';
import {
  createDailyPuzzle,
  goalLabel,
  isGoalDone,
  loginPending,
  msUntilTomorrow,
  PUZZLE_REWARD,
  streakIfClaimed,
  streakReward,
  type Goal,
} from '../game/daily';
import { useGame } from '../hooks/GameProvider';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

function useCountdown(): string {
  const [ms, setMs] = useState(msUntilTomorrow);
  useEffect(() => {
    const t = setInterval(() => setMs(msUntilTomorrow()), 30_000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

function GoalRow({ goal, onClaim }: { goal: Goal; onClaim: () => void }) {
  const done = isGoalDone(goal);
  return (
    <View style={[styles.card, styles.goal]}>
      <View style={styles.goalText}>
        <Text style={styles.goalLabel}>{goalLabel(goal)}</Text>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${(goal.progress / goal.target) * 100}%` }, done && styles.barDone]} />
        </View>
        <Text style={styles.goalProgress}>
          {goal.progress.toLocaleString()} / {goal.target.toLocaleString()}
        </Text>
      </View>
      {goal.claimed ? (
        <View style={styles.claimed}>
          <Icon name="check" size={22} color={colors.valid} />
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={done ? `Claim ${goal.reward} coins` : `Reward ${goal.reward} coins`}
          disabled={!done}
          onPress={onClaim}
          style={[styles.reward, done && styles.rewardReady]}
        >
          <Icon name="coin" size={18} color={done ? '#4A2C00' : colors.gold} />
          <Text style={[styles.rewardText, done && { color: '#4A2C00' }]}>{done ? 'CLAIM' : goal.reward}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function DailyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { today, daily, dailyTarget, rewards, feedback } = useGame();
  const r = rewards.state;
  const countdown = useCountdown();
  const puzzleBoard = useMemo(() => createDailyPuzzle(today).state.board, [today]);

  const pending = loginPending(r, today);
  const streak = pending ? streakIfClaimed(r, today) : r.streak;
  const d = r.daily;
  const inProgress = daily.game.moveCount > 0 && !daily.game.gameOver;

  const claim = (fn: () => void) => {
    fn();
    feedback.play('combo');
    feedback.vibrate('clear');
  };
  const playPuzzle = () => {
    if (daily.game.gameOver) daily.restart();
    router.push('/game?mode=daily');
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <ScreenHeader title="DAILY" coins={r.coins} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.refresh}>
          <Icon name="calendar" size={16} color={colors.textDim} />
          <Text style={styles.refreshText}>New challenges in {countdown}</Text>
        </View>

        {/* Login streak */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Icon name="flame" size={22} color="#FF8A3D" />
            <Text style={styles.cardTitle}>{streak}-day streak</Text>
          </View>
          <StreakStrip streak={streak} claimedToday={!pending} />
          {pending && (
            <GameButton label={`Claim ${streakReward(streak)}`} icon="coin" variant="gold" onPress={() => claim(rewards.claimLogin)} />
          )}
        </View>

        {/* Daily puzzle */}
        <View style={[styles.card, styles.puzzle]}>
          <MiniBoard board={puzzleBoard} size={96} />
          <View style={styles.puzzleInfo}>
            <Text style={styles.cardTitle}>Daily Puzzle</Text>
            <View style={styles.inline}>
              <Icon name="target" size={16} color={colors.textDim} />
              <Text style={styles.meta}>Score {dailyTarget.toLocaleString()}</Text>
            </View>
            <View style={styles.inline}>
              <Icon name="coin" size={16} color={colors.gold} />
              <Text style={styles.meta}>{PUZZLE_REWARD} coins</Text>
            </View>
            {d.puzzleSolved && d.puzzleClaimed ? (
              <View style={styles.inline}>
                <Icon name="check" size={18} color={colors.valid} />
                <Text style={[styles.meta, { color: colors.valid }]}>Solved today</Text>
              </View>
            ) : d.puzzleSolved ? (
              <GameButton label="Claim" icon="coin" variant="gold" onPress={() => claim(rewards.claimPuzzle)} />
            ) : (
              <GameButton label={inProgress ? 'Continue' : 'Play'} icon="play" onPress={playPuzzle} />
            )}
          </View>
        </View>
        {d.puzzleClaimed && <GameButton label="Play puzzle again" icon="restart" variant="ghost" onPress={playPuzzle} />}

        {/* Goals */}
        <Text style={styles.section}>TODAY&apos;S GOALS</Text>
        {d.goals.map((g, i) => (
          <GoalRow key={`${d.day}-${i}`} goal={g} onClaim={() => claim(() => rewards.claimGoal(i))} />
        ))}
        <Text style={styles.hint}>Goals count in both classic games and the daily puzzle.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBottom },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, backgroundColor: colors.header },
  content: { padding: spacing.lg, gap: spacing.md, width: '100%', maxWidth: 520, alignSelf: 'center' },
  refresh: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  refreshText: { ...typography.label, color: colors.textDim, letterSpacing: 0.5 },
  card: {
    padding: spacing.md,
    gap: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.tray,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { ...typography.title, fontSize: 18, letterSpacing: 1, color: colors.text },
  puzzle: { flexDirection: 'row', alignItems: 'center' },
  puzzleInfo: { flex: 1, gap: 6 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { ...typography.label, fontSize: 13, letterSpacing: 0.5, color: colors.textDim },
  section: { ...typography.label, color: colors.textDim, marginTop: spacing.sm },
  goal: { flexDirection: 'row', alignItems: 'center' },
  goalText: { flex: 1, gap: 6 },
  goalLabel: { ...typography.body, fontWeight: '800', color: colors.text },
  bar: { height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.35)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: colors.boardBorder },
  barDone: { backgroundColor: colors.valid },
  goalProgress: { ...typography.label, fontSize: 11, letterSpacing: 0.5, color: colors.textMuted },
  reward: {
    minWidth: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  rewardReady: { backgroundColor: colors.gold },
  rewardText: { ...typography.label, fontSize: 13, letterSpacing: 0.5, color: colors.gold },
  claimed: { minWidth: 76, alignItems: 'center' },
  hint: { ...typography.body, fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
