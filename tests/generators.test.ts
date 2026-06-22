import { describe, it, expect } from 'vitest';
import Fraction from 'fraction.js';
import type { Problem } from '../src/types';
import { ALL_NUMERIC_TEMPLATES } from '../src/problems/generators/registry';

function assertStructurallyValid(problem: Problem): void {
  expect(problem.id).toMatch(/^[a-z0-9-]+$/);
  expect(problem.text.length).toBeGreaterThan(5);
  expect(problem.tags.length).toBeGreaterThan(0);
  expect(problem.source).toBe('generator');

  // Walkthrough invariants
  expect(problem.walkthrough.steps.length).toBeGreaterThanOrEqual(2);
  expect(problem.walkthrough.steps.length).toBeLessThanOrEqual(6);
  for (const step of problem.walkthrough.steps) {
    expect(step.math.length).toBeGreaterThan(0);
    expect(step.caption.length).toBeGreaterThan(0);
  }

  // Self-explanation invariant: exactly one correct option
  if (problem.walkthrough.selfExplanation) {
    const correctCount = problem.walkthrough.selfExplanation.options.filter(
      (o) => o.isCorrect,
    ).length;
    expect(correctCount).toBe(1);
    expect(problem.walkthrough.selfExplanation.options.length).toBeGreaterThanOrEqual(2);
  }

  // Answer canonical is non-empty and matches form
  expect(problem.answer.canonical.length).toBeGreaterThan(0);
  const form = problem.answer.form.kind;
  const value = problem.answer.value;
  if (form === 'fraction') {
    expect(value.kind).toBe('fraction');
  } else if (form === 'decimal') {
    expect(value.kind).toBe('decimal');
  } else if (form === 'integer') {
    expect(value.kind).toBe('integer');
  } else if (form === 'currency') {
    expect(value.kind).toBe('currency');
  }
}

function valueAsNumber(problem: Problem): number {
  const v = problem.answer.value;
  if (v.kind === 'integer') return v.value;
  if (v.kind === 'decimal') return v.value;
  if (v.kind === 'currency') return v.cents / 100;
  if (v.kind === 'fraction') return v.n / v.d;
  throw new Error('unknown value kind');
}

// Math correctness check: parse the problem text for simple binary expressions
// and re-compute. Catches template bugs where the claimed answer doesn't match
// the stated problem. Only works for templates with predictable text patterns.
function reverifyIfBinaryOp(problem: Problem): void {
  // Match patterns like "What is \(X op Y\)?" where X and Y are numbers or
  // fractions inside \frac{}{}.
  const stripped = problem.text
    .replace(/\\\(/g, '')
    .replace(/\\\)/g, '')
    .replace(/\\frac\{(-?\d+)\}\{(-?\d+)\}/g, (_, n, d) => `${n}/${d}`)
    .replace(/\\times/g, '*')
    .replace(/\\div/g, '/')
    .replace(/\\%/g, '%')
    .replace(/[$?]/g, '');

  // Try fraction-form match: "What is N1/D1 op N2/D2"
  const fracMatch = stripped.match(/(-?\d+\/\d+)\s*([+\-*/])\s*(-?\d+\/\d+)/);
  if (fracMatch) {
    const [, aStr, op, bStr] = fracMatch;
    const a = new Fraction(aStr as string);
    const b = new Fraction(bStr as string);
    let expected: Fraction;
    if (op === '+') expected = a.add(b);
    else if (op === '-') expected = a.sub(b).abs();
    else if (op === '*') expected = a.mul(b);
    else expected = a.div(b);
    const actual = new Fraction(problem.answer.canonical);
    // For sub, we generated guaranteeing a >= b, so abs() handles edge cases
    expect(actual.compare(expected)).toBe(0);
    return;
  }

  // Integer match for "What is X op Y?" with parenthesized negatives.
  // Skip if the text contains a decimal point — decimal templates have their
  // own (correct-by-construction) verification via JS arithmetic.
  const hasDecimal = /\d+\.\d/.test(problem.text);
  const intMatch = stripped.match(/\(?(-?\d+)\)?\s*([+\-*/])\s*\(?(-?\d+)\)?\s*$/);
  if (intMatch && !problem.text.includes('frac') && !hasDecimal) {
    const a = parseInt(intMatch[1] as string, 10);
    const b = parseInt(intMatch[3] as string, 10);
    const op = intMatch[2] as string;
    let expected: number;
    if (op === '+') expected = a + b;
    else if (op === '-') expected = a - b;
    else if (op === '*') expected = a * b;
    else expected = a / b;
    if (Number.isInteger(expected)) {
      expect(valueAsNumber(problem)).toBeCloseTo(expected, 6);
    }
  }
}

describe('numeric generators', () => {
  for (const template of ALL_NUMERIC_TEMPLATES) {
    describe(template.id, () => {
      it('generates structurally valid problems in tidy mode', () => {
        for (let i = 0; i < 50; i++) {
          const p = template.generate(true);
          assertStructurallyValid(p);
        }
      });

      it('generates structurally valid problems in loose mode', () => {
        for (let i = 0; i < 50; i++) {
          const p = template.generate(false);
          assertStructurallyValid(p);
        }
      });

      it('answer is consistent with problem text (when parseable)', () => {
        for (let i = 0; i < 25; i++) {
          const p = template.generate(true);
          reverifyIfBinaryOp(p);
        }
      });
    });
  }
});
