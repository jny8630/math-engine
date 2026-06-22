export const APP_VERSION = '0.1.0';

export const SPRINT_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export const PROBLEM_MIX = {
  numeric: 0.8,
  word: 0.2,
} as const;

export const STREAK_MILESTONES = {
  bronze: 3,
  silver: 7,
  gold: 14,
} as const;

export const STORAGE_KEY = 'math-engine:state';

// Default tidy mode on first launch — see plan, decision #4.
// ON keeps answers test-faithful for ISEE prep; flip OFF later to expose her
// to repeating decimals and rounding (upper-school confidence habit).
export const DEFAULT_TIDY_MODE = true;
