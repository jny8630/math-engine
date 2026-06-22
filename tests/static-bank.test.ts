import { describe, it, expect } from 'vitest';
import type { Problem } from '../src/types';
import { ALL_STATIC_PROBLEMS } from '../src/problems/static-bank';

describe('static word-problem bank', () => {
  it('has problems across all 8 domains', () => {
    const domains = [
      '#thrift',
      '#sewing',
      '#sailing',
      '#music',
      '#currency',
      '#reading-rate',
      '#pocket-money',
      '#spending-slope',
    ];
    for (const domain of domains) {
      const count = ALL_STATIC_PROBLEMS.filter((p) => p.tags.includes(domain as never)).length;
      expect(count, `expected at least 1 problem for ${domain}`).toBeGreaterThan(0);
    }
  });

  it('every problem is structurally valid', () => {
    for (const p of ALL_STATIC_PROBLEMS) {
      assertStructurallyValid(p);
    }
  });

  it('every problem id is unique', () => {
    const ids = ALL_STATIC_PROBLEMS.map((p) => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every problem includes #word-problem tag', () => {
    for (const p of ALL_STATIC_PROBLEMS) {
      expect(p.tags).toContain('#word-problem');
    }
  });
});

function assertStructurallyValid(problem: Problem): void {
  expect(problem.id, `id missing on problem`).toMatch(/^[a-z0-9-]+$/);
  expect(problem.text.length, `text too short on ${problem.id}`).toBeGreaterThan(10);
  expect(problem.source).toBe('static');
  expect(problem.tags.length).toBeGreaterThan(0);

  // Walkthrough
  expect(problem.walkthrough.steps.length, `walkthrough steps on ${problem.id}`).toBeGreaterThan(0);
  for (const step of problem.walkthrough.steps) {
    expect(step.math.length).toBeGreaterThan(0);
    expect(step.caption.length).toBeGreaterThan(0);
  }
  if (problem.walkthrough.selfExplanation) {
    const correct = problem.walkthrough.selfExplanation.options.filter((o) => o.isCorrect);
    expect(correct.length, `${problem.id} self-explanation needs exactly 1 correct option`).toBe(1);
  }

  // Answer canonical form matches value kind
  const form = problem.answer.form.kind;
  const value = problem.answer.value;
  expect(value.kind, `${problem.id} value.kind mismatch with form.kind`).toBe(form);
  expect(problem.answer.canonical.length).toBeGreaterThan(0);
}
