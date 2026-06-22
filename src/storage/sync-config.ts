// Per-device sync settings. Lives in a separate localStorage key from AppState
// because the PAT is a device-level secret that should NOT be synced.

const KEY = 'math-engine:sync-config';

export type SyncConfig = {
  owner: string; // GitHub username
  repo: string; // repo name (default: 'math-engine')
  token: string; // personal access token, may be empty for read-only devices
  lastPushedAt?: number;
  lastPulledAt?: number;
};

export function loadSyncConfig(): SyncConfig | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SyncConfig;
  } catch {
    return null;
  }
}

export function saveSyncConfig(config: SyncConfig): void {
  localStorage.setItem(KEY, JSON.stringify(config));
}

export function clearSyncConfig(): void {
  localStorage.removeItem(KEY);
}
