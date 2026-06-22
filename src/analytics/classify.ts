import type { AnswerValue, MisconceptionTag, Problem } from '../types';

// Match a student's entered value against the problem's known misconception
// patterns. Returns the first matching tag, or undefined if nothing matches.
export function classifyError(entered: AnswerValue, problem: Problem): MisconceptionTag | undefined {
  if (!problem.misconceptionPatterns) return undefined;
  for (const pattern of problem.misconceptionPatterns) {
    if (valuesMatch(entered, pattern.wrongValue)) return pattern.tag;
  }
  return undefined;
}

// Numeric equality for AnswerValue. Cross-multiplies fractions so unreduced
// matches reduced (10/24 = 5/12), and uses a small tolerance for floats.
function valuesMatch(a: AnswerValue, b: AnswerValue): boolean {
  if (a.kind !== b.kind) {
    // Cross-kind comparison: treat both as plain numbers with tolerance.
    return Math.abs(toNumber(a) - toNumber(b)) <= 0.001;
  }
  switch (a.kind) {
    case 'fraction': {
      const bb = b as { kind: 'fraction'; n: number; d: number };
      return a.n * bb.d === bb.n * a.d;
    }
    case 'decimal': {
      const bb = b as { kind: 'decimal'; value: number };
      return Math.abs(a.value - bb.value) <= 1e-6;
    }
    case 'integer': {
      const bb = b as { kind: 'integer'; value: number };
      return a.value === bb.value;
    }
    case 'currency': {
      const bb = b as { kind: 'currency'; cents: number };
      return Math.abs(a.cents - bb.cents) <= 1;
    }
  }
}

function toNumber(v: AnswerValue): number {
  switch (v.kind) {
    case 'fraction':
      return v.n / v.d;
    case 'decimal':
      return v.value;
    case 'integer':
      return v.value;
    case 'currency':
      return v.cents / 100;
  }
}
