import { memo, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { Settings } from '../utils/storage';
import { GameButton } from './Buttons';
import { HowToPlay } from './HowToPlay';
import { Icon, type IconName } from './Icon';
import { ModalCard } from './ModalCard';

const Toggle = memo(function Toggle({ icon, label, value, onChange }: { icon: IconName; label: string; value: boolean; onChange: (v: boolean) => void }) {
  const x = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    x.value = withSpring(value ? 1 : 0, { damping: 15, stiffness: 300 });
  }, [value, x]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * 22 }] }));
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={() => onChange(!value)}
      style={styles.toggleRow}
    >
      <Icon name={icon} size={22} color={value ? colors.text : colors.textMuted} />
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.track, value && styles.trackOn]}>
        <Animated.View style={[styles.knob, knob]} />
      </View>
    </Pressable>
  );
});

interface Props {
  /** 'pause' shows resume/restart/home; 'home' only preferences and help. */
  mode: 'pause' | 'home';
  settings: Settings;
  onChangeSettings: (patch: Partial<Settings>) => void;
  onClose: () => void;
  onRestart?: () => void;
  onHome?: () => void;
  /** Open directly on the confirmation step (used by the in-game restart button). */
  initialView?: 'main' | 'confirm';
}

export function SettingsModal({ mode, settings, onChangeSettings, onClose, onRestart, onHome, initialView = 'main' }: Props) {
  const [view, setView] = useState<'main' | 'confirm' | 'help'>(initialView);

  if (view === 'confirm') {
    return (
      <ModalCard title="Restart game?" onDismiss={initialView === 'confirm' ? onClose : () => setView('main')}>
        <Text style={styles.message}>Your current board and score will be lost.</Text>
        <GameButton label="Restart" icon="restart" variant="gold" onPress={() => onRestart?.()} />
        <GameButton label="Cancel" variant="ghost" onPress={initialView === 'confirm' ? onClose : () => setView('main')} />
      </ModalCard>
    );
  }

  if (view === 'help') {
    return (
      <ModalCard title="How to play" onDismiss={() => setView('main')}>
        <ScrollView style={styles.helpScroll} contentContainerStyle={{ paddingBottom: 4 }}>
          <HowToPlay />
        </ScrollView>
        <GameButton label="Got it" onPress={() => setView('main')} />
      </ModalCard>
    );
  }

  return (
    <ModalCard title={mode === 'pause' ? 'Paused' : 'Settings'} onDismiss={onClose}>
      {mode === 'pause' && <GameButton label="Resume" icon="play" onPress={onClose} />}
      <View style={styles.toggles}>
        <Toggle icon={settings.sound ? 'sound-on' : 'sound-off'} label="Sound" value={settings.sound} onChange={(sound) => onChangeSettings({ sound })} />
        <View style={styles.divider} />
        <Toggle icon="vibrate" label="Vibration" value={settings.haptics} onChange={(haptics) => onChangeSettings({ haptics })} />
      </View>
      <GameButton label="How to play" icon="help" variant="ghost" onPress={() => setView('help')} />
      {mode === 'pause' && (
        <View style={styles.row}>
          <GameButton label="Restart" icon="restart" variant="ghost" style={styles.flex} onPress={() => setView('confirm')} />
          <GameButton label="Home" icon="home" variant="ghost" style={styles.flex} onPress={() => onHome?.()} />
        </View>
      )}
      {mode === 'home' && <GameButton label="Done" onPress={onClose} />}
    </ModalCard>
  );
}

const styles = StyleSheet.create({
  message: { ...typography.body, color: colors.textDim, textAlign: 'center', marginBottom: 4 },
  toggles: {
    borderRadius: radius.lg,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 14,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  toggleLabel: { ...typography.button, fontSize: 16, color: colors.text, flex: 1 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  track: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.textMuted,
    padding: 3,
  },
  trackOn: { backgroundColor: '#36D68A' },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  helpScroll: { maxHeight: 380 },
});
