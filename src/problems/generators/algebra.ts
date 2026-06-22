import type { Problem, Walkthrough, SelfExplanation } from '../../types';
import {
  type NumericTemplate,
  type Rng,
  defaultRng,
  randInt,
  uid,
} from './common';

function selfExpInverseOps(): SelfExplanation {
  return {
    question: 'Why do we use the OPPOSITE operation to isolate x?',
    options: [
      { label: 'inverse operations undo each other so x is left alone', isCorrect: true },
      { label: 'to make the numbers smaller', isCorrect: false },
      { label: 'because both sides must stay equal', isCorrect: false },
    ],
  };
}

function selfExpBothSides(): SelfExplanation {
  return {
    question: 'Why do we have to apply the same step to BOTH sides?',
    options: [
      { label: 'an equation is a balance — both sides must change the same way', isCorrect: true },
      { label: 'so the variable always ends up on the left', isCorrect: false },
      { label: 'to make the numbers easier', isCorrect: false },
    ],
  };
}

function makeAlgProblem(
  templateId: string,
  text: string,
  result: number,
  walkthrough: Walkthrough,
  tags: Problem['tags'],
  rng: Rng,
): Problem {
  return {
    id: uid(templateId, rng),
    text,
    answer: {
      form: { kind: 'integer' },
      canonical: String(result),
      value: { kind: 'integer', value: result },
    },
    walkthrough,
    tags,
    source: 'generator',
  };
}

// Solve for x: x + b = c
export const algebraOneStepAdd: NumericTemplate = {
  id: 'algebra-one-step-add',
  tags: ['#algebra', '#pre-algebra'],
  generate: (tidyMode, rng = defaultRng) => {
    const range = tidyMode ? 12 : 30;
    const x = randInt(-range, range, rng);
    const b = randInt(-range, range, rng) || 1;
    const c = x + b;
    const op = b < 0 ? `- ${-b}` : `+ ${b}`;
    const inverseOp = b < 0 ? `+ ${-b}` : `- ${b}`;
    const walkthrough: Walkthrough = {
      steps: [
        {
          math: `x ${op} = ${c}`,
          caption: 'start with the equation as given',
        },
        {
          math: `x ${op} ${inverseOp} = ${c} ${inverseOp}`,
          caption: 'undo the addition by doing the opposite on both sides',
        },
        {
          math: `x = ${x}`,
          caption: 'the left side simplifies; what remains is x',
        },
      ],
      selfExplanation: selfExpInverseOps(),
    };
    return makeAlgProblem(
      'algebra-one-step-add',
      `Solve for x: \\(x ${op} = ${c}\\)`,
      x,
      walkthrough,
      ['#algebra', '#pre-algebra'],
      rng,
    );
  },
};

// Solve for x: a*x = c
export const algebraOneStepMul: NumericTemplate = {
  id: 'algebra-one-step-mul',
  tags: ['#algebra', '#pre-algebra'],
  generate: (tidyMode, rng = defaultRng) => {
    const range = tidyMode ? 10 : 15;
    const x = randInt(-range, range, rng) || 1;
    const a = randInt(2, range, rng);
    const c = a * x;
    const walkthrough: Walkthrough = {
      steps: [
        {
          math: `${a}x = ${c}`,
          caption: 'start with the equation as given',
        },
        {
          math: `\\frac{${a}x}{${a}} = \\frac{${c}}{${a}}`,
          caption: 'divide both sides by the coefficient to undo the multiplication',
        },
        {
          math: `x = ${x}`,
          caption: 'the coefficient cancels on the left, leaving x alone',
        },
      ],
      selfExplanation: selfExpBothSides(),
    };
    const base = makeAlgProblem(
      'algebra-one-step-mul',
      `Solve for x: \\(${a}x = ${c}\\)`,
      x,
      walkthrough,
      ['#algebra', '#pre-algebra'],
      rng,
    );
    return {
      ...base,
      misconceptionPatterns: [
        {
          // Common mistake: subtract the coefficient instead of dividing by it.
          tag: '#sign-error-on-move',
          wrongValue: { kind: 'integer', value: c - a },
        },
      ],
    };
  },
};

// Solve for x: a*x + b = c
export const algebraTwoStep: NumericTemplate = {
  id: 'algebra-two-step',
  tags: ['#algebra', '#pre-algebra', '#linear-equations'],
  generate: (tidyMode, rng = defaultRng) => {
    const range = tidyMode ? 8 : 15;
    const x = randInt(-range, range, rng) || 1;
    const a = randInt(2, tidyMode ? 9 : 12, rng);
    const b = randInt(-range, range, rng) || 1;
    const c = a * x + b;
    const op = b < 0 ? `- ${-b}` : `+ ${b}`;
    const inverseOp = b < 0 ? `+ ${-b}` : `- ${b}`;
    const walkthrough: Walkthrough = {
      steps: [
        {
          math: `${a}x ${op} = ${c}`,
          caption: 'start with the equation; we want x alone',
        },
        {
          math: `${a}x ${op} ${inverseOp} = ${c} ${inverseOp}`,
          caption: 'first peel off the constant — undo the addition',
        },
        {
          math: `${a}x = ${a * x}`,
          caption: 'simplify both sides',
        },
        {
          math: `\\frac{${a}x}{${a}} = \\frac{${a * x}}{${a}}`,
          caption: 'now divide both sides by the coefficient',
        },
        {
          math: `x = ${x}`,
          caption: 'x is isolated',
        },
      ],
      selfExplanation: selfExpInverseOps(),
    };
    return makeAlgProblem(
      'algebra-two-step',
      `Solve for x: \\(${a}x ${op} = ${c}\\)`,
      x,
      walkthrough,
      ['#algebra', '#pre-algebra', '#linear-equations'],
      rng,
    );
  },
};

export const algebraTemplates: NumericTemplate[] = [
  algebraOneStepAdd,
  algebraOneStepMul,
  algebraTwoStep,
];
