import Fraction from 'fraction.js';
import type { ConceptTag, Problem } from '../../types';

export { Fraction };

// ---------------------------------------------------------------------------
// Random helpers — RNG is injectable for testing reproducibility.
// ---------------------------------------------------------------------------

export type Rng = () => number;
export const defaultRng: Rng = Math.random;

export function randInt(min: number, max: number, rng: Rng = defaultRng): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function randChoice<T>(arr: readonly T[], rng: Rng = defaultRng): T {
  return arr[Math.floor(rng() * arr.length)] as T;
}

export function uid(prefix: string, rng: Rng = defaultRng): string {
  return `${prefix}-${Math.floor(rng() * 0xffffffff).toString(36)}`;
}

// ---------------------------------------------------------------------------
// Fraction rendering — both KaTeX (for walkthrough math) and plain (for IDs
// and canonical answer strings).
// ---------------------------------------------------------------------------

export function fracToKatex(f: Fraction): string {
  const n = Number(f.n);
  const d = Number(f.d);
  if (d === 1) return `${f.s < 0 ? '-' : ''}${n}`;
  return `${f.s < 0 ? '-' : ''}\\frac{${n}}{${d}}`;
}

export function fracToString(f: Fraction): string {
  const n = Number(f.n);
  const d = Number(f.d);
  if (d === 1) return `${f.s < 0 ? '-' : ''}${n}`;
  return `${f.s < 0 ? '-' : ''}${n}/${d}`;
}

export function isProperReduced(f: Fraction): boolean {
  return Number(f.n) < Number(f.d);
}

// ---------------------------------------------------------------------------
// Template contract — every numeric template implements this.
// ---------------------------------------------------------------------------

export type NumericTemplate = {
  id: string;
  tags: ConceptTag[];
  // `generate` returns a fully-formed Problem. tidyMode controls input ranges.
  generate: (tidyMode: boolean, rng?: Rng) => Problem;
};
