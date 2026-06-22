import type { Problem } from '../types';
import { PROBLEM_MIX } from '../config';
import { numericGeneratorProvider } from './generators';
import { staticBankProvider } from './static-bank';

// Pick the next problem for a sprint, mixing 80% numeric / 20% word problems.
// Uses a per-call random draw — simple and good enough for a 10-minute sprint.
// If the static bank is empty (e.g. mid-development), falls back to numeric.
export function composeNextProblem(
  tidyMode: boolean,
  rng: () => number = Math.random,
): Problem {
  const isWord = rng() < PROBLEM_MIX.word;
  if (isWord && staticBankProvider.count('word') > 0) {
    return staticBankProvider.getProblem({ category: 'word' }, tidyMode);
  }
  return numericGeneratorProvider.getProblem({ category: 'numeric' }, tidyMode);
}
