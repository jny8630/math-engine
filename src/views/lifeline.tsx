import type { Problem } from '../types';
import { MathText } from './katex';

export type LifelineViewProps = {
  problem: Problem;
  onFlag: () => void;
};

export function LifelineView({ problem, onFlag }: LifelineViewProps) {
  return (
    <main class="lifeline-screen">
      <header class="lifeline-header">No worries — we'll come back to this one.</header>
      <section class="lifeline-problem">
        <div class="problem-text">
          <MathText text={problem.text} />
        </div>
      </section>
      <footer class="lifeline-footer">
        <button class="flag-btn" onClick={onFlag}>
          Flag this one for Dad 👋
        </button>
      </footer>
    </main>
  );
}
