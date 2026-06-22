import { useEffect, useReducer } from 'preact/hooks';
import {
  initialSprintState,
  sprintReducer,
  timeRemainingMs,
  type SprintState,
} from '../sprint/engine';
import { ProblemView } from './problem';
import { WalkthroughView } from './walkthrough';
import { LifelineView } from './lifeline';
import { SprintResultView } from './sprint-result';

export type SprintContainerProps = {
  tidyMode: boolean;
  onComplete: (state: SprintState) => void;
};

export function SprintContainer({ tidyMode, onComplete }: SprintContainerProps) {
  const [state, dispatch] = useReducer(sprintReducer, initialSprintState);

  // Start sprint on mount.
  useEffect(() => {
    dispatch({ type: 'start', tidyMode, now: Date.now() });
  }, [tidyMode]);

  // Timer tick — every 250ms is smooth enough for a digit display.
  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'tick', now: Date.now() }), 250);
    return () => clearInterval(id);
  }, []);

  // Notify parent once the sprint ends so they can persist + navigate.
  useEffect(() => {
    if (state.phase.kind === 'ended') {
      onComplete(state);
    }
  }, [state.phase.kind, state, onComplete]);

  const phase = state.phase;
  switch (phase.kind) {
    case 'idle':
      return <main class="sprint-loading">Loading…</main>;
    case 'problem':
      return (
        <ProblemView
          problem={phase.problem}
          isRetry={false}
          timeRemainingMs={timeRemainingMs(state)}
          onSubmit={(entered) => dispatch({ type: 'submit', entered })}
          onEndSprint={() => dispatch({ type: 'endSprint' })}
        />
      );
    case 'walkthrough':
      return (
        <WalkthroughView
          problem={phase.problem}
          entered={phase.firstEntered}
          onGotIt={() => dispatch({ type: 'gotIt' })}
        />
      );
    case 'retry':
      return (
        <ProblemView
          problem={phase.problem}
          isRetry={true}
          timeRemainingMs={timeRemainingMs(state)}
          onSubmit={(entered) => dispatch({ type: 'submitRetry', entered })}
          onEndSprint={() => dispatch({ type: 'endSprint' })}
        />
      );
    case 'lifeline':
      return (
        <LifelineView
          problem={phase.problem}
          onFlag={() => dispatch({ type: 'flagForHelp' })}
        />
      );
    case 'ended':
      return (
        <SprintResultView
          result={phase.result}
          onPlayAgain={() => dispatch({ type: 'start', tidyMode, now: Date.now() })}
        />
      );
  }
}
