import { LinearGradient } from 'expo-linear-gradient';
import { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Icon, type IconName } from './Icon';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function usePressScale(to = 0.94) {
  const s = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return {
    style,
    onPressIn: () => s.set(withSpring(to, { damping: 15, stiffness: 400 })),
    onPressOut: () => s.set(withSpring(1, { damping: 10, stiffness: 300 })),
  };
}

const VARIANTS = {
  primary: { face: [colors.primaryLight, colors.primary] as const, base: colors.primaryDark, text: colors.text },
  gold: { face: ['#FFE29A', colors.gold] as const, base: colors.goldDark, text: '#4A2C00' },
  ghost: { face: [colors.surfaceRaised, colors.surface] as const, base: '#16113A', text: colors.text },
};

interface GameButtonProps {
  label: string;
  onPress: () => void;
  variant?: keyof typeof VARIANTS;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

/** Chunky 3D game button with press-down animation. */
export const GameButton = memo(function GameButton({ label, onPress, variant = 'primary', icon, style, disabled }: GameButtonProps) {
  const press = usePressScale(0.95);
  const v = VARIANTS[variant];
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={disabled}
      style={[styles.btn, { backgroundColor: v.base, opacity: disabled ? 0.5 : 1 }, press.style, style]}
    >
      <LinearGradient colors={v.face} style={styles.btnFace}>
        {icon && <Icon name={icon} size={22} color={v.text} />}
        <Text style={[styles.btnText, { color: v.text }]}>{label}</Text>
      </LinearGradient>
    </AnimatedPressable>
  );
});

interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  label: string;
  size?: number;
  badge?: ReactNode;
  disabled?: boolean;
  active?: boolean;
  /** Bare icon with no button background. */
  plain?: boolean;
}

export const IconButton = memo(function IconButton({ icon, onPress, label, size = 44, badge, disabled, active = true, plain }: IconButtonProps) {
  const press = usePressScale(0.88);
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={disabled}
      style={[
        styles.iconBtn,
        plain && styles.plain,
        { width: size, height: size, borderRadius: size * 0.34, opacity: disabled ? 0.4 : 1 },
        press.style,
      ]}
    >
      <Icon name={icon} size={size * 0.52} color={active ? colors.text : colors.textMuted} />
      {badge != null && <View style={styles.badge}>{typeof badge === 'string' || typeof badge === 'number' ? <Text style={styles.badgeText}>{badge}</Text> : badge}</View>}
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.lg,
    paddingBottom: 5,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  btnFace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: radius.lg,
  },
  btnText: { ...typography.button },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderBottomWidth: 3,
  },
  plain: { backgroundColor: 'transparent', borderWidth: 0 },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 11, fontWeight: '900', color: '#4A2C00' },
});
