import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, type ReactNode } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface Props {
  title: string;
  children: ReactNode;
  /** Called on backdrop tap and Android back. Omit to make the modal blocking. */
  onDismiss?: () => void;
}

/**
 * In-screen overlay, shown and hidden instantly. Rendered inside the screen
 * (not a native Modal) so gestures behave consistently.
 */
export function ModalCard({ title, children, onDismiss }: Props) {
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onDismiss?.();
      return true; // never let back navigate away from under a modal
    });
    return () => sub.remove();
  }, [onDismiss]);

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel="Close" />
      <View style={styles.card}>
        <LinearGradient colors={[colors.surfaceRaised, colors.surface]} style={[StyleSheet.absoluteFill, { borderRadius: radius.xl }]} />
        <Text style={styles.title}>{title}</Text>
        <View style={styles.body}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    zIndex: 100,
    elevation: 100,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 20,
  },
  title: { ...typography.title, fontSize: 24, color: colors.text, textAlign: 'center' },
  body: { marginTop: spacing.lg, gap: spacing.md },
});
