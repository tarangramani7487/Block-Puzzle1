import { AuthorizationStatus, getAPNSToken, getMessaging, requestPermission, subscribeToTopic } from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

/** FCM topic the daily 9:30 PM reminder campaign is sent to. */
export const DAILY_REMINDER_TOPIC = 'daily_reminder';

async function askPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    // Android 12 and below grant notifications at install time.
    if (Platform.Version < 33) return true;
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }
  const status = await requestPermission(getMessaging());
  return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
}

// FCM topic subscription on iOS needs the APNS token, which arrives asynchronously after permission.
async function waitForAPNSToken(timeoutMs = 10000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await getAPNSToken(getMessaging())) return true;
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

/** Asks for notification permission and, if granted, subscribes to the daily reminder. */
export async function setupNotifications() {
  try {
    if (!(await askPermission())) return;
    if (Platform.OS === 'ios' && !(await waitForAPNSToken())) return;
    await subscribeToTopic(getMessaging(), DAILY_REMINDER_TOPIC);
  } catch {
    // Notifications are optional; never block the game on them.
  }
}
