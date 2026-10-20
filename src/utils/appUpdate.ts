import {
  fetchAndActivate,
  getRemoteConfig,
  getString,
} from "@react-native-firebase/remote-config";
import { Linking, Platform } from "react-native";
import { getVersion } from "react-native-device-info";

const FORCE_UPDATE_KEY = "force_update_app_version";
// Fallback used until Remote Config fetches a real value.
const DEFAULT_MIN_VERSION = "0.0.0";

// iOS App Store numeric ID. Set once the app is listed; until then iOS falls back to a web search.
const IOS_APP_STORE_ID: string | null = null;
const ANDROID_PACKAGE = "com.htr.block.puzzle";

export interface AppUpdateState {
  required: boolean;
  requiredVersion: string;
  currentVersion: string;
}

/** Numeric comparison of dot-separated versions. Missing segments count as 0. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((p) => parseInt(p, 10) || 0);
  const pb = b.split(".").map((p) => parseInt(p, 10) || 0);
  const n = Math.max(pa.length, pb.length);
  for (let i = 0; i < n; i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na !== nb) return na < nb ? -1 : 1;
  }
  return 0;
}

/** Fetches `force_update_app_version` from Remote Config and compares it to the installed version. */
export async function checkAppUpdate(): Promise<AppUpdateState> {
  const config = getRemoteConfig();
  config.defaultConfig = { [FORCE_UPDATE_KEY]: DEFAULT_MIN_VERSION };
  // Remote Config caches for 12h by default; skip caching in dev so testers see new values immediately.
  if (__DEV__)
    config.settings = { ...config.settings, minimumFetchIntervalMillis: 0 };
  await fetchAndActivate(config);
  const requiredVersion =
    getString(config, FORCE_UPDATE_KEY) || DEFAULT_MIN_VERSION;
  const currentVersion = getVersion();
  return {
    required: compareVersions(currentVersion, requiredVersion) < 0,
    requiredVersion,
    currentVersion,
  };
}

/** Opens the platform store page for this app. */
export function openStore() {
  if (Platform.OS === "ios") {
    const url = IOS_APP_STORE_ID
      ? `itms-apps://itunes.apple.com/app/id${IOS_APP_STORE_ID}`
      : "https://apps.apple.com/";
    Linking.openURL(url).catch(() => {});
    return;
  }
  const market = `market://details?id=${ANDROID_PACKAGE}`;
  Linking.openURL(market).catch(() => {
    Linking.openURL(
      `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`,
    ).catch(() => {});
  });
}
