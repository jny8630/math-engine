import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  initialSprintState,
  sprintReducer,
  timeRemainingMs,
  type SprintState,
} from '../src/sprint/engine';
import { SPRINT_DURATION_MS } from '../src/config';

// Use a deterministic Math.random for reproducibility — the engine uses
// composeNextProblem which calls Math.random under the hood.
beforeEach(() => {
  let seed = 0.42;
  vi.spyOn(Math, 'random').mockImplementation(() => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  });
});

describe('sprint engine', () => {
  it('starts in idle phase with full time remaining', () => {
    expect(initialSprintState.phase.kind).toBe('idle');
    expect(timeRemainingMs(initialSprintState)).toBe(SPRINT_DURATION_MS);
  });

  it('start dispatches to a problem phase', () => {
    const state = sprintReducer(initialSprintState, { type: 'start', tidyMode: true, now: 1000 });
    expect(state.phase.kind).toBe('problem');
    expect(state.sprintStartedAt).toBe(1000);
    expect(state.attempts).toHaveLength(0);
  });

  it('correct answer records attempt and advances', () => {
    let state = sprintReducer(initialSprintState, { type: 'start', tidyMode: true, now: 0 });
    if (state.phase.kind !== 'problem') throw new Error('expected problem phase');
    const correctAnswer = state.phase.problem.answer.canonical;
    state = sprintReducer(state, { type: 'submit', entered: correctAnswer });
    expect(state.phase.kind).toBe('problem');
    expect(state.attempts).toHaveLength(1);
    expect(state.attempts[0]!.result).toBe('correct');
  });

  it('wrong answer transitions to walkthrough (timer pauses)', () => {
    let state = sprintReducer(initialSprintState, { type: 'start', tidyMode: true, now: 0 });
    state = { ...state, now: 1000 };
    state = sprintReducer(state, { type: 'submit', entered: 'wrong-on-purpose' });
    expect(state.phase.kind).toBe('walkthrough');
    expect(state.activeElapsedAccumulatedMs).toBe(1000);
  });

  it('wrong then "got it" then correct retry records wrong-first', () => {
    let state = sprintReducer(initialSprintState, { type: 'start', tidyMode: true, now: 0 });
    if (state.phase.kind !== 'problem') throw new Error('expected problem phase');
    const correctAnswer = state.phase.problem.answer.canonical;

    state = sprintReducer(state, { type: 'submit', entered: 'wrong' });
    expect(state.phase.kind).toBe('walkthrough');

    state = sprintReducer(state, { type: 'gotIt' });
    expect(state.phase.kind).toBe('retry');

    state = sprintReducer(state, { type: 'submitRetry', entered: correctAnswer });
    expect(state.phase.kind).toBe('problem'); // advanced to next problem
    expect(state.attempts).toHaveLength(1);
    expect(state.attempts[0]!.result).toBe('wrong-first');
  });

  it('two wrongs lead to lifeline, flagForHelp records as flagged', () => {
    let state = sprintReducer(initialSprintState, { type: 'start', tidyMode: true, now: 0 });
    state = sprintReducer(state, { type: 'submit', entered: 'wrong-1' });
    state = sprintReducer(state, { type: 'gotIt' });
    state = sprintReducer(state, { type: 'submitRetry', entered: 'wrong-2' });
    expect(state.phase.kind).toBe('lifeline');
    state = sprintReducer(state, { type: 'flagForHelp' });
    expect(state.phase.kind).toBe('problem');
    expect(state.attempts).toHaveLength(1);
    expect(state.attempts[0]!.result).toBe('flagged');
  });

  it('walkthrough phase does NOT consume sprint time', () => {
    let state = sprintReducer(initialSprintState, { type: 'start', tidyMode: true, now: 0 });
    state = { ...state, now: 1000 };
    state = sprintReducer(state, { type: 'submit', entered: 'wrong' });
    // Walkthrough phase — advance clock by 30 seconds
    state = sprintReducer(state, { type: 'tick', now: 31_000 });
    // Active time elapsed should still be 1000ms (just the original problem)
    expect(state.activeElapsedAccumulatedMs).toBe(1000);
    expect(timeRemainingMs(state)).toBe(SPRINT_DURATION_MS - 1000);
  });

  it('timer expiry finalizes the sprint', () => {
    let state = sprintReducer(initialSprintState, { type: 'start', tidyMode: true, now: 0 });
    state = sprintReducer(state, { type: 'tick', now: SPRINT_DURATION_MS + 100 });
    expect(state.phase.kind).toBe('ended');
    if (state.phase.kind === 'ended') {
      expect(state.phase.result.endedReason).toBe('timer');
    }
  });

  it('endSprint button finalizes the sprint', () => {
    let state = sprintReducer(initialSprintState, { type: 'start', tidyMode: true, now: 0 });
    state = sprintReducer(state, { type: 'endSprint' });
    expect(state.phase.kind).toBe('ended');
    if (state.phase.kind === 'ended') {
      expect(state.phase.result.endedReason).toBe('button');
    }
  });
});

// Type assertion helper for narrowing in tests
function _typeguard(_s: SprintState) {
  /* noop */
}
_typeguard(initialSprintState);
