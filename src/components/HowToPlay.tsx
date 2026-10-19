import { StyleSheet, Text, View } from 'react-native';

import { FUSION_MIN_GROUP, MAX_LEVEL } from '../game/constants';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { GameBlock } from './GameBlock';

const RULES: { title: string; text: string }[] = [
  { title: 'Place', text: 'Drag pieces from the tray onto the board. Use all three to get new ones.' },
  { title: 'Clear', text: 'Fill a whole row or column to clear it. Clear several at once for a big bonus.' },
  {
    title: 'Fuse',
    text: `After clearing, if your piece joins same-colour blocks into a group of ${FUSION_MIN_GROUP}+, the whole group levels up — and can chain into the next colour.`,
  },
  { title: 'Supernova', text: `Fusing level-${MAX_LEVEL} blocks makes them burst off the board for huge points.` },
  { title: 'Combo', text: 'Clear on consecutive moves to multiply line points. 3 moves without a clear ends the combo.' },
  { title: 'Game over', text: 'The game ends when none of your remaining pieces fit.' },
];

export function HowToPlay() {
  return (
    <View style={styles.wrap}>
      <View style={styles.levels}>
        {[1, 2, 3, 4, 5, 6].map((l) => (
          <View key={l} style={styles.level}>
            <GameBlock size={28} level={l} />
            <Text style={styles.levelText}>{l}</Text>
          </View>
        ))}
      </View>
      {RULES.map((r) => (
        <Text key={r.title} style={styles.rule}>
          <Text style={styles.ruleTitle}>{r.title}. </Text>
          {r.text}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  levels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  level: { alignItems: 'center', gap: 2 },
  levelText: { ...typography.label, color: colors.textDim, fontSize: 10 },
  rule: { ...typography.body, fontSize: 14, lineHeight: 19, color: colors.textDim },
  ruleTitle: { color: colors.text, fontWeight: '800' },
});
