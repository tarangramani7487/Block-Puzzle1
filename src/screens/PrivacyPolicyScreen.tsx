import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '../components/Buttons';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

// TODO: set the real support address before publishing the policy.
const CONTACT_EMAIL = 'your-email@example.com';
const DEVELOPER = 'Block Puzzle';
const EFFECTIVE_DATE = 'October 19, 2026';

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'Overview',
    body: [
      `This Privacy Policy explains how ${DEVELOPER} ("we", "us") handles information when you use the Block Puzzle app and website (the "Service").`,
      'Block Puzzle does not require an account. We do not ask for your name, email address, phone number, contacts, photos or precise location.',
    ],
  },
  {
    title: 'Information stored on your device',
    body: [
      'Your best score, current game, daily puzzle progress, coins, themes and settings (sound, vibration, tutorial) are saved only on your device. They are not sent to us, and they are deleted when you uninstall the app or clear its data.',
    ],
  },
  {
    title: 'Analytics (Google Firebase Analytics)',
    body: [
      'We use Firebase Analytics to understand how the game is played and to improve it. It collects usage information such as app opens, session length, screens viewed, game events (for example game over and score), app version, device model, operating system, language and approximate country derived from your IP address.',
      'This data is linked to a random app-instance identifier, not to your identity.',
    ],
  },
  {
    title: 'Crash reports (Google Firebase Crashlytics)',
    body: [
      'If the app crashes or hits an error, Firebase Crashlytics sends a report with technical details such as the stack trace, device model, operating system version, free memory and app state at the time of the crash. We use it only to find and fix bugs.',
    ],
  },
  {
    title: 'Notifications (Firebase Cloud Messaging)',
    body: [
      'If you allow notifications, your device receives a push token from Firebase Cloud Messaging and is subscribed to our daily reminder. We use it only to send game reminders, such as the daily puzzle reminder.',
      'You can turn notifications off at any time in your device settings.',
    ],
  },
  {
    title: 'How information is shared',
    body: [
      'We do not sell your information. Information described above is processed by Google as our service provider under the Google Firebase terms and privacy policy (https://firebase.google.com/support/privacy).',
      'We may disclose information if required by law.',
    ],
  },
  {
    title: 'Data retention',
    body: [
      'Analytics data is kept for the retention period configured in Firebase (up to 14 months). Crash reports are kept for up to 90 days. Data stored on your device stays until you delete the app or its data.',
    ],
  },
  {
    title: "Children's privacy",
    body: [
      'The Service is a general-audience game and is not directed at children under 13. We do not knowingly collect personal information from children. If you believe a child has provided personal information, contact us and we will delete it.',
    ],
  },
  {
    title: 'Your choices and rights',
    body: [
      'You can disable notifications in your device settings and delete all locally stored data by uninstalling the app. Depending on where you live, you may have the right to request access to or deletion of data; contact us and we will help.',
    ],
  },
  {
    title: 'Changes to this policy',
    body: ['We may update this policy from time to time. Changes will be posted on this page with a new effective date.'],
  },
  {
    title: 'Contact us',
    body: [`Questions about this policy? Email us at ${CONTACT_EMAIL}.`],
  },
];

/** Public privacy policy, also served on the web at /privacy-policy. */
export function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxl, paddingLeft: insets.left + spacing.lg, paddingRight: insets.right + spacing.lg },
        ]}
      >
        <View style={styles.inner}>
          <View style={styles.header}>
            <IconButton icon="back" label="Back" size={40} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
            <Text style={styles.title} accessibilityRole="header">
              Privacy Policy
            </Text>
          </View>
          <Text style={styles.date}>Effective date: {EFFECTIVE_DATE}</Text>

          {SECTIONS.map((s) => (
            <View key={s.title} style={styles.section}>
              <Text style={styles.heading} accessibilityRole="header">
                {s.title}
              </Text>
              {s.body.map((p, i) => (
                <Text key={i} style={styles.body}>
                  {p}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBottom },
  content: { alignItems: 'center' },
  inner: { width: '100%', maxWidth: 720, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { ...typography.title, fontSize: 24, color: colors.text, flex: 1 },
  date: { ...typography.label, color: colors.textDim },
  section: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  heading: { ...typography.button, fontSize: 17, color: colors.gold },
  body: { ...typography.body, color: colors.text, opacity: 0.9 },
});
