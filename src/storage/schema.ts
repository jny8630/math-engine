import type { AppState } from '../types';
import { DEFAULT_TIDY_MODE } from '../config';

export const CURRENT_SCHEMA_VERSION = 1 as const;

export function emptyState(): AppState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    sprints: [],
    streak: {
      currentDays: 0,
      longestDays: 0,
      lastSprintDate: null,
      bronze: false,
      silver: false,
      gold: false,
    },
    tidyMode: DEFAULT_TIDY_MODE,
    tidyModeHistory: [],
    syncedAt: null,
  };
}

// Migration scaffolding for future schema bumps. Only one version today; later
// migrations register handlers keyed by source version.
export function migrate(raw: unknown): AppState {
  if (!raw || typeof raw !== 'object') return emptyState();
  const obj = raw as Partial<AppState>;
  if (obj.schemaVersion === CURRENT_SCHEMA_VERSION) {
    return obj as AppState;
  }
  return emptyState();
}
