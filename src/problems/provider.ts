import type { ConceptTag, Problem } from '../types';

export type ProblemCategory = 'numeric' | 'word';

export type ProblemRequest = {
  category: ProblemCategory;
  excludeTags?: ConceptTag[];
  preferTags?: ConceptTag[];
};

// The swap-enabling interface. Both the numeric generator and the static word
// bank implement this. The sprint composer asks for problems by category and
// doesn't care where they came from — so a future word-problem generator can
// drop in by implementing this same interface.
export interface ProblemProvider {
  getProblem(request: ProblemRequest, tidyMode: boolean): Problem;
  count(category: ProblemCategory): number;
}
