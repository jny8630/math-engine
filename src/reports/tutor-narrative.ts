import type { AppState, SprintResult } from '../types';
import {
  flaggedAttempts,
  misconceptionStruggles,
  conceptStruggles,
  thisWeek,
  priorWeek,
  totalAttempts,
} from '../analytics/tagging';

export type TutorNarrative = {
  weekLabel: string;
  sentences: string[];
  flaggedCount: number;
  topMisconception: { tag: string; count: number } | null;
  tidyModeNote: string;
};

// Generate a narrative summary of the past week. Keeps the tone neutral and
// observational — the tutor will read it before a session and act on it.
export function generateTutorNarrative(state: AppState, asOfMs: number): TutorNarrative {
  const thisW = thisWeek(state.sprints, asOfMs);
  const lastW = priorWeek(state.sprints, asOfMs);

  const sentences: string[] = [];

  // 1. Sprint count
  if (thisW.length === 0) {
    sentences.push('Beatrix did not complete any sprints this week.');
  } else {
    sentences.push(
      `This week Beatrix completed ${thisW.length} sprint${thisW.length === 1 ? '' : 's'}.`,
    );
  }

  // 2. Pace trend vs last week
  if (thisW.length > 0 && lastW.length > 0) {
    const twAvg = totalAttempts(thisW) / thisW.length;
    const lwAvg = totalAttempts(lastW) / lastW.length;
    if (twAvg > lwAvg + 0.5) {
      sentences.push(
        `Speed is improving — averaging ${twAvg.toFixed(1)} problems per sprint, up from ${lwAvg.toFixed(1)} last week.`,
      );
    } else if (twAvg < lwAvg - 0.5) {
      sentences.push(
        `Pace dipped this week — ${twAvg.toFixed(1)} problems per sprint vs ${lwAvg.toFixed(1)} last week.`,
      );
    } else {
      sentences.push(`Pace is steady at ${twAvg.toFixed(1)} problems per sprint.`);
    }
  }

  // 3. Flagged for help
  const flagged = flaggedAttempts(thisW);
  if (flagged.length > 0) {
    sentences.push(
      `She flagged ${flagged.length} problem${flagged.length === 1 ? '' : 's'} for help.`,
    );
  }

  // 4. Top misconception
  const misconceptions = misconceptionStruggles(thisW);
  const topMis = misconceptions[0] ?? null;
  if (topMis && topMis.count >= 2) {
    sentences.push(
      `Most common pattern in her mistakes: ${humanize(topMis.tag)} (${topMis.count}×).`,
    );
  }

  // 5. Concept struggles (fallback if no misconception cluster)
  const concepts = conceptStruggles(thisW).filter((c) => c.count >= 3);
  if (concepts.length > 0 && (!topMis || topMis.count < 2)) {
    sentences.push(
      `Topic with the most errors: ${humanize(concepts[0]!.tag)} (${concepts[0]!.count} wrong).`,
    );
  }

  // 6. Recommendation hook based on top misconception
  if (topMis && topMis.count >= 2) {
    sentences.push(recommendationFor(topMis.tag));
  }

  // 7. Tidy mode state
  const tidyModeNote = state.tidyMode
    ? 'Tidy mode is ON — answers were constrained to clean forms (test-faithful for ISEE prep).'
    : 'Tidy mode is OFF — Beatrix has been working with repeating decimals and rounding.';

  const weekLabel = formatWeekLabel(asOfMs);
  return {
    weekLabel,
    sentences,
    flaggedCount: flagged.length,
    topMisconception: topMis,
    tidyModeNote,
  };
}

function formatWeekLabel(asOfMs: number): string {
  const end = new Date(asOfMs);
  const start = new Date(asOfMs - 6 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `Week of ${fmt(start)} – ${fmt(end)}`;
}

// Render a misconception or concept tag as readable English for the report.
export function humanize(tag: string): string {
  const m: Record<string, string> = {
    // Misconceptions
    '#flipped-numerator-denominator': 'flipping numerator and denominator',
    '#added-num-and-denom': 'adding numerators and denominators directly in fraction addition',
    '#missed-common-denom': 'missing the common denominator step',
    '#didnt-invert-on-divide': 'forgetting to invert the divisor when dividing fractions',
    '#decimal-shift-error': 'shifting the decimal in the wrong direction',
    '#treated-as-whole-number': 'treating a percent as a whole number',
    '#additive-not-multiplicative': 'adding the percent instead of multiplying',
    '#sign-error': 'sign errors with negative numbers',
    '#absolute-value-confusion': 'confusion around absolute value',
    '#didnt-distribute': 'failing to distribute across parentheses',
    '#sign-error-on-move': 'subtracting instead of dividing when isolating a variable',
    '#combined-unlike-terms': 'combining unlike terms in algebra',
    // Concept tags
    '#fractions': 'fractions',
    '#decimals': 'decimals',
    '#percent': 'percents',
    '#negative-integers': 'negative integers',
    '#algebra': 'algebra',
    '#pre-algebra': 'pre-algebra word problems',
    '#linear-equations': 'linear equations',
    '#word-problem': 'word problems',
  };
  return m[tag] ?? tag.replace(/^#/, '').replace(/-/g, ' ');
}

function recommendationFor(tag: string): string {
  const recs: Record<string, string> = {
    '#added-num-and-denom':
      'Suggest spending a few minutes on common denominators — bar-model practice would reinforce the why.',
    '#didnt-invert-on-divide':
      'Worth re-grounding "dividing by a fraction = multiplying by its reciprocal" with two or three examples.',
    '#sign-error':
      'A short drill on subtracting and multiplying with negatives — the number-line visual usually clicks.',
    '#sign-error-on-move':
      'Review of inverse operations when isolating a variable — multiplication uses division, addition uses subtraction.',
  };
  return recs[tag] ?? '';
}

// Pretty-print a sprint date for tables / lists.
export function formatSprintDate(s: SprintResult): string {
  return new Date(s.endedAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
