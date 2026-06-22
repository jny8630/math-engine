import type { ProblemAttempt, SprintResult } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

export type TagCount = { tag: string; count: number };

export function sprintsBetween(
  sprints: SprintResult[],
  startMsInclusive: number,
  endMsExclusive: number,
): SprintResult[] {
  return sprints.filter((s) => s.endedAt >= startMsInclusive && s.endedAt < endMsExclusive);
}

export function thisWeek(sprints: SprintResult[], asOfMs: number): SprintResult[] {
  return sprintsBetween(sprints, asOfMs - WEEK_MS, asOfMs);
}

export function priorWeek(sprints: SprintResult[], asOfMs: number): SprintResult[] {
  return sprintsBetween(sprints, asOfMs - 2 * WEEK_MS, asOfMs - WEEK_MS);
}

export function today(sprints: SprintResult[], asOfMs: number): SprintResult[] {
  const startOfDay = new Date(asOfMs);
  startOfDay.setHours(0, 0, 0, 0);
  return sprintsBetween(sprints, startOfDay.getTime(), asOfMs + 1);
}

export function totalAttempts(sprints: SprintResult[]): number {
  return sprints.reduce((sum, s) => sum + s.attempts.length, 0);
}

export function totalCorrect(sprints: SprintResult[]): number {
  return sprints.reduce(
    (sum, s) => sum + s.attempts.filter((a) => a.result === 'correct').length,
    0,
  );
}

export function flaggedAttempts(sprints: SprintResult[]): ProblemAttempt[] {
  return sprints.flatMap((s) => s.attempts.filter((a) => a.result === 'flagged'));
}

// Count wrong-or-flagged attempts grouped by concept tag, sorted desc by count.
export function conceptStruggles(sprints: SprintResult[]): TagCount[] {
  const counts: Record<string, number> = {};
  for (const s of sprints) {
    for (const a of s.attempts) {
      if (a.result === 'correct') continue;
      for (const tag of a.problem.tags) {
        counts[tag] = (counts[tag] ?? 0) + 1;
      }
    }
  }
  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

// Count attempts grouped by detected misconception tag, sorted desc.
export function misconceptionStruggles(sprints: SprintResult[]): TagCount[] {
  const counts: Record<string, number> = {};
  for (const s of sprints) {
    for (const a of s.attempts) {
      if (!a.misconception) continue;
      counts[a.misconception] = (counts[a.misconception] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

// Per-spec: "Struggle Areas surface when 3+ errors share a tag within a week."
export function strongStruggles(sprints: SprintResult[], threshold = 3): TagCount[] {
  return conceptStruggles(sprints).filter((s) => s.count >= threshold);
}
