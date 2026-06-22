import { useState } from 'preact/hooks';
import type { Problem, SelfExplanationOption } from '../types';
import { Katex, MathText } from './katex';
import { VisualSlot } from './visuals';

export type WalkthroughViewProps = {
  problem: Problem;
  entered: string;
  onGotIt: () => void;
};

export function WalkthroughView({ problem, entered, onGotIt }: WalkthroughViewProps) {
  const [picked, setPicked] = useState<SelfExplanationOption | null>(null);

  return (
    <main class="walkthrough-screen">
      <header class="walkthrough-header">Let's walk through this one.</header>

      <section class="problem-restated">
        <div class="problem-text">
          <MathText text={problem.text} />
        </div>
        <div class="answer-chips">
          <span class="chip chip-entered">
            You entered: <strong>{entered}</strong>
          </span>
          <span class="chip chip-correct">
            Correct: <strong>{problem.answer.canonical}</strong>
          </span>
        </div>
      </section>

      <section class="walkthrough-steps">
        {problem.walkthrough.steps.map((step, i) => (
          <div class="walkthrough-step" key={i}>
            <div class="step-number">Step {i + 1}</div>
            <div class="step-math">
              <Katex source={step.math} displayMode />
            </div>
            <div class="step-caption">because {step.caption.replace(/^because\s+/i, '')}</div>
            {step.visual && (
              <div class="step-visual">
                <VisualSlot kind={step.visual} />
              </div>
            )}
          </div>
        ))}
      </section>

      {problem.walkthrough.selfExplanation && (
        <section class="self-explanation">
          <div class="self-explanation-question">
            Why does this work? {problem.walkthrough.selfExplanation.question}
          </div>
          <div class="self-explanation-options">
            {problem.walkthrough.selfExplanation.options.map((opt, i) => {
              const isPicked = picked === opt;
              const cls =
                isPicked && opt.isCorrect
                  ? 'opt opt-picked-correct'
                  : isPicked
                    ? 'opt opt-picked-wrong'
                    : 'opt';
              return (
                <button
                  key={i}
                  class={cls}
                  onClick={() => setPicked(opt)}
                  disabled={picked !== null}
                >
                  {opt.label}
                  {isPicked && opt.isCorrect && <span class="opt-check"> ✓</span>}
                  {isPicked && !opt.isCorrect && <span class="opt-x"> – not quite</span>}
                </button>
              );
            })}
          </div>
          {picked && !picked.isCorrect && (
            <div class="self-explanation-hint">
              The right reason is the first one — take another look at the steps above.
            </div>
          )}
        </section>
      )}

      <footer class="walkthrough-footer">
        <button class="got-it-btn" onClick={onGotIt}>
          Got it — let's try again
        </button>
      </footer>
    </main>
  );
}
