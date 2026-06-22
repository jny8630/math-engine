import Fraction from 'fraction.js';
import type { Answer, AnswerForm, AnswerValue } from '../types';

// Parse free-response input into an AnswerValue matching the expected form.
// Returns null when the input can't be interpreted as the expected form.
export function parseAnswer(input: string, form: AnswerForm): AnswerValue | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  switch (form.kind) {
    case 'fraction':
      return parseFractionInput(trimmed);
    case 'decimal':
      return parseDecimalInput(trimmed);
    case 'integer':
      return parseIntegerInput(trimmed);
    case 'currency':
      return parseCurrencyInput(trimmed);
  }
}

function parseFractionInput(input: string): AnswerValue | null {
  try {
    const f = new Fraction(input);
    return { kind: 'fraction', n: Number(f.n) * f.s, d: Number(f.d) };
  } catch {
    return null;
  }
}

function parseDecimalInput(input: string): AnswerValue | null {
  // Allow comma as decimal separator (European convention) and strip units.
  const normalized = input.replace(/,/g, '.').replace(/[^\d.\-]/g, '');
  const n = parseFloat(normalized);
  if (Number.isNaN(n)) return null;
  return { kind: 'decimal', value: n };
}

function parseIntegerInput(input: string): AnswerValue | null {
  // Allow stripping of %, $, commas, whitespace. Reject fractional inputs.
  const cleaned = input.replace(/[%$,\s]/g, '');
  if (cleaned.includes('.')) return null;
  const n = parseInt(cleaned, 10);
  if (Number.isNaN(n)) return null;
  return { kind: 'integer', value: n };
}

function parseCurrencyInput(input: string): AnswerValue | null {
  const cleaned = input.replace(/[$,\s]/g, '');
  const n = parseFloat(cleaned);
  if (Number.isNaN(n)) return null;
  return { kind: 'currency', cents: Math.round(n * 100) };
}

// Check whether a parsed answer matches the expected answer, applying form-
// specific equivalence rules (decimal tolerance, fraction reduction, etc.).
export function isCorrect(entered: AnswerValue, expected: Answer): boolean {
  if (entered.kind !== expected.value.kind) {
    return crossFormMatch(entered, expected);
  }
  switch (entered.kind) {
    case 'fraction': {
      const exp = expected.value as { kind: 'fraction'; n: number; d: number };
      const enteredVal = entered.n / entered.d;
      const expectedVal = exp.n / exp.d;
      if (Math.abs(enteredVal - expectedVal) > 1e-9) return false;
      if (expected.form.kind === 'fraction' && !expected.form.allowUnreduced) {
        const g = gcd(Math.abs(entered.n), Math.abs(entered.d));
        if (g !== 1) return false;
      }
      return true;
    }
    case 'decimal': {
      const exp = expected.value as { kind: 'decimal'; value: number };
      const tolerance =
        (expected.form.kind === 'decimal' ? expected.form.tolerance : undefined) ?? 0.005;
      // Add a small epsilon so JS float math (e.g. 21.91 - 21.9 = 0.010000…02)
      // doesn't reject answers that are within tolerance up to rounding error.
      return Math.abs(entered.value - exp.value) <= tolerance + 1e-9;
    }
    case 'integer': {
      const exp = expected.value as { kind: 'integer'; value: number };
      return entered.value === exp.value;
    }
    case 'currency': {
      const exp = expected.value as { kind: 'currency'; cents: number };
      // Allow $0.01 rounding tolerance for cents
      return Math.abs(entered.cents - exp.cents) <= 1;
    }
  }
}

// When the entered form differs from expected, compare via numeric value with
// a generous tolerance. Lets a student enter "0.5" when "1/2" was expected.
function crossFormMatch(entered: AnswerValue, expected: Answer): boolean {
  const enteredNum = toNumber(entered);
  const expectedNum = toNumber(expected.value);
  return Math.abs(enteredNum - expectedNum) <= 0.01;
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

function gcd(a: number, b: number): number {
  while (b) {
    [a, b] = [b, a % b];
  }
  return Math.abs(a) || 1;
}
