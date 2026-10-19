import * as Haptics from 'expo-haptics';

export type HapticKind = 'pickup' | 'place' | 'invalid' | 'clear' | 'fusion' | 'gameover';

/** Fire-and-forget haptic feedback. Errors (e.g. unsupported device) are ignored. */
export function haptic(kind: HapticKind): void {
  let p: Promise<void>;
  switch (kind) {
    case 'pickup':
      p = Haptics.selectionAsync();
      break;
    case 'place':
      p = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'invalid':
      p = Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
    case 'clear':
      p = Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'fusion':
      p = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'gameover':
      p = Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
  }
  p.catch(() => {});
}
