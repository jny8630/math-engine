import type { MisconceptionTag, Problem, ProblemAttempt, SprintResult } from '../types';
import { composeNextProblem } from '../problems/compose';
import { SPRINT_DURATION_MS } from '../config';
import { isCorrect, parseAnswer } from './parse';
import { classifyError } from '../analytics/classify';

// ---------------------------------------------------------------------------
// Phases
// ---------------------------------------------------------------------------
// idle → problem → (correct) → next problem
//                → (wrong) → walkthrough → retry → (correct) → next problem
//                                                → (wrong) → lifeline → next problem
// timer paused during: walkthrough, lifeline. ended is terminal.

export type SprintPhase =
  | { kind: 'idle' }
  | { kind: 'problem'; problem: Problem; problemStartedAt: number }
  | {
      kind: 'walkthrough';
      problem: Problem;
      firstEntered: string;
      firstStartedAt: number;
      firstMisconception?: MisconceptionTag;
    }
  | {
      kind: 'retry';
      problem: Problem;
      firstEntered: string;
      firstStartedAt: number;
      retryStartedAt: number;
      firstMisconception?: MisconceptionTag;
    }
  | {
      kind: 'lifeline';
      problem: Problem;
      firstEntered: string;
      retryEntered: string;
      firstStartedAt: number;
      firstMisconception?: MisconceptionTag;
    }
  | { kind: 'ended'; result: SprintResult };

export type SprintState = {
  phase: SprintPhase;
  sprintStartedAt: number;
  attempts: ProblemAttempt[];
  tidyMode: boolean;
  // Timer accounting: only 'problem' and 'retry' phases consume sprint time.
  activeElapsedAccumulatedMs: number;
  currentPhaseStartedAt: number;
  now: number;
};

export type SprintAction =
  | { type: 'start'; tidyMode: boolean; now: number }
  | { type: 'tick'; now: number }
  | { type: 'submit'; entered: string }
  | { type: 'gotIt' }
  | { type: 'submitRetry'; entered: string }
  | { type: 'flagForHelp' }
  | { type: 'endSprint' }
  | { type: 'reset' };

export const initialSprintState: SprintState = {
  phase: { kind: 'idle' },
  sprintStartedAt: 0,
  attempts: [],
  tidyMode: true,
  activeElapsedAccumulatedMs: 0,
  currentPhaseStartedAt: 0,
  now: 0,
};

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

function isActivePhase(phase: SprintPhase): boolean {
  return phase.kind === 'problem' || phase.kind === 'retry';
}

export function timeRemainingMs(state: SprintState): number {
  if (state.phase.kind === 'idle' || state.phase.kind === 'ended') {
    return SPRINT_DURATION_MS;
  }
  let elapsed = state.activeElapsedAccumulatedMs;
  if (isActivePhase(state.phase)) {
    elapsed += Math.max(0, state.now - state.currentPhaseStartedAt);
  }
  return Math.max(0, SPRINT_DURATION_MS - elapsed);
}

export function sprintStats(state: SprintState): {
  attempted: number;
  correct: number;
  flagged: number;
} {
  let correct = 0;
  let flagged = 0;
  for (const a of state.attempts) {
    if (a.result === 'correct') correct++;
    if (a.result === 'flagged') flagged++;
  }
  return { attempted: state.attempts.length, correct, flagged };
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function sprintReducer(state: SprintState, action: SprintAction): SprintState {
  switch (action.type) {
    case 'start': {
      const problem = composeNextProblem(action.tidyMode);
      return {
        ...initialSprintState,
        tidyMode: action.tidyMode,
        sprintStartedAt: action.now,
        currentPhaseStartedAt: action.now,
        now: action.now,
        phase: { kind: 'problem', problem, problemStartedAt: action.now },
      };
    }

    case 'tick': {
      const updated = { ...state, now: action.now };
      if (state.phase.kind === 'idle' || state.phase.kind === 'ended') {
        return updated;
      }
      if (timeRemainingMs(updated) <= 0) {
        return finalizeSprint(updated, 'timer');
      }
      return updated;
    }

    case 'submit': {
      if (state.phase.kind !== 'problem') return state;
      const problem = state.phase.problem;
      const parsed = parseAnswer(action.entered, problem.answer.form);
      const correct = parsed !== null && isCorrect(parsed, problem.answer);
      if (correct) {
        const attempt: ProblemAttempt = {
          problemId: problem.id,
          problem,
          enteredFirst: action.entered,
          enteredRetry: null,
          result: 'correct',
          startedAt: state.phase.problemStartedAt,
          endedAt: state.now,
        };
        return advanceToNextProblem({
          ...state,
          attempts: [...state.attempts, attempt],
        });
      }
      // Wrong → walkthrough (pause timer). Classify the mistake for the report.
      const misconception = parsed ? classifyError(parsed, problem) : undefined;
      const elapsedNow = state.now - state.currentPhaseStartedAt;
      return {
        ...state,
        activeElapsedAccumulatedMs: state.activeElapsedAccumulatedMs + elapsedNow,
        currentPhaseStartedAt: state.now,
        phase: {
          kind: 'walkthrough',
          problem,
          firstEntered: action.entered,
          firstStartedAt: state.phase.problemStartedAt,
          firstMisconception: misconception,
        },
      };
    }

    case 'gotIt': {
      if (state.phase.kind !== 'walkthrough') return state;
      // Walkthrough was paused; entering retry resumes the timer.
      return {
        ...state,
        currentPhaseStartedAt: state.now,
        phase: {
          kind: 'retry',
          problem: state.phase.problem,
          firstEntered: state.phase.firstEntered,
          firstStartedAt: state.phase.firstStartedAt,
          retryStartedAt: state.now,
          firstMisconception: state.phase.firstMisconception,
        },
      };
    }

    case 'submitRetry': {
      if (state.phase.kind !== 'retry') return state;
      const problem = state.phase.problem;
      const correct = checkAnswer(action.entered, problem);
      if (correct) {
        const attempt: ProblemAttempt = {
          problemId: problem.id,
          problem,
          enteredFirst: state.phase.firstEntered,
          enteredRetry: action.entered,
          result: 'wrong-first',
          startedAt: state.phase.firstStartedAt,
          endedAt: state.now,
          ...(state.phase.firstMisconception
            ? { misconception: state.phase.firstMisconception }
            : {}),
        };
        return advanceToNextProblem({
          ...state,
          attempts: [...state.attempts, attempt],
        });
      }
      // Wrong on retry → lifeline (pause timer again)
      const elapsedNow = state.now - state.currentPhaseStartedAt;
      return {
        ...state,
        activeElapsedAccumulatedMs: state.activeElapsedAccumulatedMs + elapsedNow,
        currentPhaseStartedAt: state.now,
        phase: {
          kind: 'lifeline',
          problem,
          firstEntered: state.phase.firstEntered,
          retryEntered: action.entered,
          firstStartedAt: state.phase.firstStartedAt,
          firstMisconception: state.phase.firstMisconception,
        },
      };
    }

    case 'flagForHelp': {
      if (state.phase.kind !== 'lifeline') return state;
      const attempt: ProblemAttempt = {
        problemId: state.phase.problem.id,
        problem: state.phase.problem,
        enteredFirst: state.phase.firstEntered,
        enteredRetry: state.phase.retryEntered,
        result: 'flagged',
        startedAt: state.phase.firstStartedAt,
        endedAt: state.now,
        ...(state.phase.firstMisconception
          ? { misconception: state.phase.firstMisconception }
          : {}),
      };
      return advanceToNextProblem({
        ...state,
        attempts: [...state.attempts, attempt],
      });
    }

    case 'endSprint':
      return finalizeSprint(state, 'button');

    case 'reset':
      return initialSprintState;
  }
}

function advanceToNextProblem(state: SprintState): SprintState {
  if (timeRemainingMs(state) <= 0) {
    return finalizeSprint(state, 'timer');
  }
  const next = composeNextProblem(state.tidyMode);
  return {
    ...state,
    currentPhaseStartedAt: state.now,
    phase: { kind: 'problem', problem: next, problemStartedAt: state.now },
  };
}

function finalizeSprint(state: SprintState, reason: 'timer' | 'button'): SprintState {
  const result: SprintResult = {
    id: `sprint-${state.sprintStartedAt}`,
    startedAt: state.sprintStartedAt,
    endedAt: state.now,
    durationMs: state.now - state.sprintStartedAt,
    attempts: state.attempts,
    endedReason: reason,
    tidyModeAtStart: state.tidyMode,
  };
  return {
    ...state,
    phase: { kind: 'ended', result },
  };
}

function checkAnswer(entered: string, problem: Problem): boolean {
  const parsed = parseAnswer(entered, problem.answer.form);
  if (parsed === null) return false;
  return isCorrect(parsed, problem.answer);
}

// Aggregate misconception tags across a list of attempts. Returns counts keyed
// by tag, useful for dashboards and the tutor report.
export function misconceptionFrequencies(attempts: ProblemAttempt[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const a of attempts) {
    if (a.misconception) {
      counts[a.misconception] = (counts[a.misconception] ?? 0) + 1;
    }
  }
  return counts;
}
