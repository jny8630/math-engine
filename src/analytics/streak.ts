import type { SprintResult, StreakState } from '../types';
import { STREAK_MILESTONES } from '../config';

function dateKey(ms: number): string {
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function dayDiff(aIso: string, bIso: string): number {
  const a = new Date(aIso + 'T00:00:00');
  const b = new Date(bIso + 'T00:00:00');
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

// Walk every sprint chronologically and rebuild streak state. Pure function;
// safe to recompute from the full sprint history any time.
export function computeStreak(sprints: SprintResult[], previous: StreakState): StreakState {
  if (sprints.length === 0) return previous;

  // Unique sorted day keys with at least one completed sprint
  const days = Array.from(new Set(sprints.map((s) => dateKey(s.endedAt)))).sort();

  // Walk days to compute the current consecutive-day streak ending on the last day
  let current = 1;
  let longest = 1;
  for (let i = 1; i < days.length; i++) {
    if (dayDiff(days[i - 1]!, days[i]!) === 1) {
      current += 1;
    } else {
      current = 1;
    }
    if (current > longest) longest = current;
  }

  const lastSprintDate = days[days.length - 1]!;
  const longestOverall = Math.max(previous.longestDays, longest);

  return {
    currentDays: current,
    longestDays: longestOverall,
    lastSprintDate,
    bronze: previous.bronze || longestOverall >= STREAK_MILESTONES.bronze,
    silver: previous.silver || longestOverall >= STREAK_MILESTONES.silver,
    gold: previous.gold || longestOverall >= STREAK_MILESTONES.gold,
  };
}
