import type { SprintResult } from '../types';

export type SprintResultViewProps = {
  result: SprintResult;
  onPlayAgain: () => void;
};

export function SprintResultView({ result, onPlayAgain }: SprintResultViewProps) {
  const attempted = result.attempts.length;
  const correct = result.attempts.filter((a) => a.result === 'correct').length;
  const gotItOnRetry = result.attempts.filter((a) => a.result === 'wrong-first').length;
  const flagged = result.attempts.filter((a) => a.result === 'flagged').length;
  const minutes = Math.round(result.durationMs / 60000);

  return (
    <main class="result-screen">
      <header class="result-header">Sprint done.</header>
      <div class="result-subhead">
        {minutes} minute{minutes === 1 ? '' : 's'} of focused practice —{' '}
        {result.endedReason === 'timer' ? 'timer ran out' : 'you wrapped it up'}.
      </div>

      <section class="result-stats">
        <Stat value={attempted} label="problems attempted" />
        <Stat value={correct} label="correct on the first try" emphasis />
        <Stat value={gotItOnRetry} label="got it on the retry" />
        <Stat value={flagged} label="flagged for Dad" />
      </section>

      {flagged > 0 && (
        <section class="flagged-list">
          <h2>Flagged for review</h2>
          <ul>
            {result.attempts
              .filter((a) => a.result === 'flagged')
              .map((a) => (
                <li key={a.problemId}>{a.problem.text}</li>
              ))}
          </ul>
        </section>
      )}

      <footer class="result-footer">
        <button class="primary-btn" onClick={onPlayAgain}>
          Start another sprint
        </button>
      </footer>
    </main>
  );
}

function Stat({ value, label, emphasis }: { value: number; label: string; emphasis?: boolean }) {
  return (
    <div class={emphasis ? 'stat stat-emphasis' : 'stat'}>
      <div class="stat-value">{value}</div>
      <div class="stat-label">{label}</div>
    </div>
  );
}
