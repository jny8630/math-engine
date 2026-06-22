import { describe, it, expect } from 'vitest';
import { parseAnswer, isCorrect } from '../src/sprint/parse';
import type { Answer } from '../src/types';

describe('parseAnswer', () => {
  it('parses fractions', () => {
    expect(parseAnswer('5/12', { kind: 'fraction' })).toEqual({ kind: 'fraction', n: 5, d: 12 });
    expect(parseAnswer('10/24', { kind: 'fraction' })).toEqual({ kind: 'fraction', n: 5, d: 12 });
    expect(parseAnswer('-3/4', { kind: 'fraction' })).toEqual({ kind: 'fraction', n: -3, d: 4 });
    expect(parseAnswer('garbage', { kind: 'fraction' })).toBeNull();
    expect(parseAnswer('', { kind: 'fraction' })).toBeNull();
  });

  it('parses decimals', () => {
    expect(parseAnswer('1.5', { kind: 'decimal', places: 2 })).toEqual({ kind: 'decimal', value: 1.5 });
    expect(parseAnswer('1,5', { kind: 'decimal', places: 2 })).toEqual({ kind: 'decimal', value: 1.5 });
    expect(parseAnswer('21.90', { kind: 'decimal', places: 2 })).toEqual({ kind: 'decimal', value: 21.9 });
    expect(parseAnswer('abc', { kind: 'decimal', places: 2 })).toBeNull();
  });

  it('parses integers and strips %', () => {
    expect(parseAnswer('50', { kind: 'integer' })).toEqual({ kind: 'integer', value: 50 });
    expect(parseAnswer('50%', { kind: 'integer' })).toEqual({ kind: 'integer', value: 50 });
    expect(parseAnswer('-3', { kind: 'integer' })).toEqual({ kind: 'integer', value: -3 });
    expect(parseAnswer('5.5', { kind: 'integer' })).toBeNull();
  });

  it('parses currency in cents', () => {
    expect(parseAnswer('$24.30', { kind: 'currency' })).toEqual({ kind: 'currency', cents: 2430 });
    expect(parseAnswer('24.30', { kind: 'currency' })).toEqual({ kind: 'currency', cents: 2430 });
    expect(parseAnswer('$24', { kind: 'currency' })).toEqual({ kind: 'currency', cents: 2400 });
  });
});

describe('isCorrect', () => {
  it('matches identical fractions, accepting unreduced when allowed', () => {
    const expected: Answer = {
      form: { kind: 'fraction', allowUnreduced: false },
      canonical: '5/12',
      value: { kind: 'fraction', n: 5, d: 12 },
    };
    expect(isCorrect({ kind: 'fraction', n: 5, d: 12 }, expected)).toBe(true);
    // Unreduced 10/24 = 5/12 — rejected because allowUnreduced is false
    expect(isCorrect({ kind: 'fraction', n: 10, d: 24 }, expected)).toBe(false);
  });

  it('accepts decimals within tolerance', () => {
    const expected: Answer = {
      form: { kind: 'decimal', places: 2, tolerance: 0.01 },
      canonical: '21.90',
      value: { kind: 'decimal', value: 21.9 },
    };
    expect(isCorrect({ kind: 'decimal', value: 21.9 }, expected)).toBe(true);
    expect(isCorrect({ kind: 'decimal', value: 21.91 }, expected)).toBe(true);
    expect(isCorrect({ kind: 'decimal', value: 22.0 }, expected)).toBe(false);
  });

  it('integer equality is exact', () => {
    const expected: Answer = {
      form: { kind: 'integer' },
      canonical: '50',
      value: { kind: 'integer', value: 50 },
    };
    expect(isCorrect({ kind: 'integer', value: 50 }, expected)).toBe(true);
    expect(isCorrect({ kind: 'integer', value: 51 }, expected)).toBe(false);
  });

  it('cross-form match: decimal 0.5 vs fraction 1/2', () => {
    const expected: Answer = {
      form: { kind: 'fraction' },
      canonical: '1/2',
      value: { kind: 'fraction', n: 1, d: 2 },
    };
    expect(isCorrect({ kind: 'decimal', value: 0.5 }, expected)).toBe(true);
    expect(isCorrect({ kind: 'decimal', value: 0.6 }, expected)).toBe(false);
  });
});
