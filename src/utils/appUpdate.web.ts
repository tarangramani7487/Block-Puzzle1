// Web has its own release cadence; the force-update flow does nothing.
export interface AppUpdateState {
  required: boolean;
  requiredVersion: string;
  currentVersion: string;
}

export function compareVersions(_a: string, _b: string): number {
  return 0;
}

export async function checkAppUpdate(): Promise<AppUpdateState> {
  return { required: false, requiredVersion: '0.0.0', currentVersion: '0.0.0' };
}

export function openStore() {}
