// ---------------------------------------------------------------------------
// Tag taxonomies
// ---------------------------------------------------------------------------

export type ConceptTag =
  // Numeric categories
  | '#fractions'
  | '#decimals'
  | '#percent'
  | '#negative-integers'
  | '#algebra'
  // Pedagogical bridges
  | '#word-problem'
  | '#pre-algebra'
  | '#linear-equations'
  // Word-problem domains
  | '#thrift'
  | '#sewing'
  | '#sailing'
  | '#music'
  | '#currency'
  | '#reading-rate'
  | '#pocket-money'
  | '#spending-slope';

export type MisconceptionTag =
  // Fractions
  | '#flipped-numerator-denominator'
  | '#added-num-and-denom'
  | '#missed-common-denom'
  | '#didnt-invert-on-divide'
  // Percent
  | '#decimal-shift-error'
  | '#treated-as-whole-number'
  | '#additive-not-multiplicative'
  // Negative integers
  | '#sign-error'
  | '#absolute-value-confusion'
  // Algebra
  | '#didnt-distribute'
  | '#sign-error-on-move'
  | '#combined-unlike-terms';

// ---------------------------------------------------------------------------
// Answers — each template declares its form + equivalence rules
// ---------------------------------------------------------------------------

export type AnswerForm =
  | { kind: 'fraction'; allowUnreduced?: boolean }
  | { kind: 'decimal'; places: number; tolerance?: number }
  | { kind: 'integer' }
  | { kind: 'currency' }; // stored as integer cents

export type AnswerValue =
  | { kind: 'fraction'; n: number; d: number }
  | { kind: 'decimal'; value: number }
  | { kind: 'integer'; value: number }
  | { kind: 'currency'; cents: number };

export type Answer = {
  form: AnswerForm;
  canonical: string; // human-readable, e.g. "5/12", "0.42", "-3", "$18.75"
  value: AnswerValue;
};

// ---------------------------------------------------------------------------
// Walkthroughs — the "prove it" moment
// ---------------------------------------------------------------------------

export type Visual = 'bar-model' | 'number-line' | 'percent-grid';

export type WalkthroughStep = {
  math: string; // KaTeX source
  caption: string; // one-sentence "because ___"
  visual?: Visual;
};

export type SelfExplanationOption = { label: string; isCorrect: boolean };

export type SelfExplanation = {
  question: string;
  options: SelfExplanationOption[];
};

export type Walkthrough = {
  steps: WalkthroughStep[];
  selfExplanation?: SelfExplanation;
};

// ---------------------------------------------------------------------------
// Problem — the swap-enabling shape; both generators and static bank return this
// ---------------------------------------------------------------------------

// A precomputed "common wrong answer" + the misconception it suggests. Each
// numeric generator template embeds these for the classifier to match against.
export type MisconceptionPattern = {
  tag: MisconceptionTag;
  wrongValue: AnswerValue;
};

export type Problem = {
  id: string;
  text: string; // problem statement; may include placeholders substituted at runtime
  answer: Answer;
  walkthrough: Walkthrough;
  tags: ConceptTag[];
  source: 'generator' | 'static';
  misconceptionPatterns?: MisconceptionPattern[];
};

// ---------------------------------------------------------------------------
// Sprint state
// ---------------------------------------------------------------------------

export type AttemptResult = 'correct' | 'wrong-first' | 'wrong-retry' | 'flagged';

export type ProblemAttempt = {
  problemId: string;
  problem: Problem;
  enteredFirst: string | null;
  enteredRetry: string | null;
  result: AttemptResult;
  misconception?: MisconceptionTag;
  startedAt: number; // epoch ms
  endedAt: number;
};

export type SprintEndedReason = 'timer' | 'button';

export type SprintResult = {
  id: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  attempts: ProblemAttempt[];
  endedReason: SprintEndedReason;
  tidyModeAtStart: boolean;
};

// ---------------------------------------------------------------------------
// Streaks + persisted app state
// ---------------------------------------------------------------------------

export type StreakState = {
  currentDays: number;
  longestDays: number;
  lastSprintDate: string | null; // YYYY-MM-DD
  bronze: boolean; // 3-day streak
  silver: boolean; // 7-day streak
  gold: boolean;   // 14-day streak
};

export type TidyModeChange = { at: number; to: boolean };

export type AppState = {
  schemaVersion: 1;
  sprints: SprintResult[];
  streak: StreakState;
  tidyMode: boolean;
  tidyModeHistory: TidyModeChange[];
  syncedAt: number | null;
};
