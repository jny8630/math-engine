import type { Problem } from '../types';
import { MathText } from './katex';
import { AnswerInput } from './answer-input';

export type ProblemViewProps = {
  problem: Problem;
  isRetry: boolean;
  timeRemainingMs: number;
  onSubmit: (entered: string) => void;
  onEndSprint: () => void;
};

export function ProblemView({
  problem,
  isRetry,
  timeRemainingMs,
  onSubmit,
  onEndSprint,
}: ProblemViewProps) {
  return (
    <main class="sprint-screen">
      <header class="sprint-header">
        <Timer ms={timeRemainingMs} />
        <button class="end-sprint-btn" onClick={onEndSprint}>
          End sprint
        </button>
      </header>
      <section class="problem-prompt">
        {isRetry && <div class="retry-banner">From memory — try again.</div>}
        <div class="problem-text">
          <MathText text={problem.text} />
        </div>
      </section>
      <AnswerInput
        form={problem.answer.form}
        onSubmit={onSubmit}
        resetKey={problem.id + (isRetry ? '-retry' : '')}
      />
    </main>
  );
}

function Timer({ ms }: { ms: number }) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return (
    <div class="timer" aria-label="Time remaining">
      {min}:{sec.toString().padStart(2, '0')}
    </div>
  );
}
