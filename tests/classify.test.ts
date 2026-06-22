import { describe, it, expect } from 'vitest';
import Fraction from 'fraction.js';
import { classifyError } from '../src/analytics/classify';
import { fractionAdd, fractionDiv } from '../src/problems/generators/fractions';
import { integerSub, integerMul } from '../src/problems/generators/negative-integers';
import { algebraOneStepMul } from '../src/problems/generators/algebra';

// Helper: keep generating problems until one matches a predicate, so tests
// don't depend on the global RNG order.
function findProblem<T extends { generate: (m: boolean) => any }>(
  template: T,
  pred: (p: ReturnType<T['generate']>) => boolean,
  tidyMode = true,
  maxTries = 200,
) {
  for (let i = 0; i < maxTries; i++) {
    const p = template.generate(tidyMode);
    if (pred(p)) return p;
  }
  throw new Error('no matching problem found in maxTries');
}

describe('classifyError', () => {
  it('catches "added num and denom" on fraction-add', () => {
    // Find a fraction-add problem and reconstruct the classic wrong answer.
    const problem = fractionAdd.generate(true);
    const text = problem.text;
    // Extract n/d from KaTeX expressions: \frac{a}{b}
    const matches = [...text.matchAll(/\\frac\{(\d+)\}\{(\d+)\}/g)];
    expect(matches.length).toBe(2);
    const [m1, m2] = matches;
    const wrongN = parseInt(m1![1]!, 10) + parseInt(m2![1]!, 10);
    const wrongD = parseInt(m1![2]!, 10) + parseInt(m2![2]!, 10);
    const tag = classifyError({ kind: 'fraction', n: wrongN, d: wrongD }, problem);
    expect(tag).toBe('#added-num-and-denom');
  });

  it('catches "didnt invert on divide" on fraction-div', () => {
    const problem = fractionDiv.generate(true);
    const matches = [...problem.text.matchAll(/\\frac\{(\d+)\}\{(\d+)\}/g)];
    expect(matches.length).toBe(2);
    const a = new Fraction(parseInt(matches[0]![1]!, 10), parseInt(matches[0]![2]!, 10));
    const b = new Fraction(parseInt(matches[1]![1]!, 10), parseInt(matches[1]![2]!, 10));
    // The mistake is multiply, not invert-and-multiply
    const wrong = a.mul(b);
    const tag = classifyError(
      { kind: 'fraction', n: Number(wrong.n), d: Number(wrong.d) },
      problem,
    );
    expect(tag).toBe('#didnt-invert-on-divide');
  });

  it('catches sign error on integer-sub when subtrahend is negative', () => {
    const problem = findProblem(integerSub, (p) => p.text.includes('- (-'));
    // Strip KaTeX delimiters and parens, then split on the minus operator.
    const stripped = problem.text.replace(/[\\()]/g, '');
    const m = stripped.match(/(-?\d+)\s*-\s*(-?\d+)/);
    expect(m).not.toBeNull();
    const a = parseInt(m![1]!, 10);
    const b = parseInt(m![2]!, 10);
    const wrong = a - Math.abs(b); // the classic "treated -3 as 3" mistake
    const tag = classifyError({ kind: 'integer', value: wrong }, problem);
    expect(tag).toBe('#sign-error');
  });

  it('catches sign error on integer-mul with mixed signs', () => {
    const problem = findProblem(integerMul, (p) => /\(-/.test(p.text));
    // Wrong answer is |product|
    const correct = (problem.answer.value as { kind: 'integer'; value: number }).value;
    if (correct >= 0) return; // skip if both negative (no mixed sign)
    const tag = classifyError({ kind: 'integer', value: Math.abs(correct) }, problem);
    expect(tag).toBe('#sign-error');
  });

  it('catches subtract-instead-of-divide on algebra-one-step-mul', () => {
    const problem = algebraOneStepMul.generate(true);
    // Extract a and c from "Solve for x: \(ax = c\)"
    const m = problem.text.match(/(\d+)x = (-?\d+)/);
    expect(m).not.toBeNull();
    const a = parseInt(m![1]!, 10);
    const c = parseInt(m![2]!, 10);
    const wrong = c - a;
    const tag = classifyError({ kind: 'integer', value: wrong }, problem);
    expect(tag).toBe('#sign-error-on-move');
  });

  it('returns undefined when answer matches no known mistake', () => {
    const problem = fractionAdd.generate(true);
    const tag = classifyError({ kind: 'fraction', n: 99999, d: 1 }, problem);
    expect(tag).toBeUndefined();
  });
});
