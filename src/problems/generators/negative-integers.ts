import type { Problem, Walkthrough, SelfExplanation } from '../../types';
import {
  type NumericTemplate,
  type Rng,
  defaultRng,
  randInt,
  uid,
} from './common';

function selfExpSignFlip(): SelfExplanation {
  return {
    question: 'Why did the sign flip when we subtracted a negative?',
    options: [
      { label: 'subtracting a negative cancels two minuses into a plus', isCorrect: true },
      { label: 'because negatives always flip', isCorrect: false },
      { label: 'because absolute value made them positive', isCorrect: false },
    ],
  };
}

function selfExpTwoNegs(): SelfExplanation {
  return {
    question: 'Why is a negative times a negative a positive?',
    options: [
      { label: 'each negative flips the direction; two flips return forward', isCorrect: true },
      { label: 'because the bigger number wins', isCorrect: false },
      { label: 'because the absolute value of the product is positive', isCorrect: false },
    ],
  };
}

function makeIntProblem(
  templateId: string,
  text: string,
  result: number,
  walkthrough: Walkthrough,
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
    tags: ['#negative-integers'],
    source: 'generator',
  };
}

export const integerAdd: NumericTemplate = {
  id: 'integer-add',
  tags: ['#negative-integers'],
  generate: (tidyMode, rng = defaultRng) => {
    const range = tidyMode ? 20 : 50;
    const a = randInt(-range, range, rng);
    const b = randInt(-range, range, rng);
    const sum = a + b;
    const aStr = a < 0 ? `(${a})` : String(a);
    const bStr = b < 0 ? `(${b})` : String(b);
    const walkthrough: Walkthrough = {
      steps: [
        {
          math: `${aStr} + ${bStr}`,
          caption: 'set up the addition; negatives stay in parentheses',
          visual: 'number-line',
        },
        {
          math: `= ${a} + ${b} = ${sum}`,
          caption:
            a >= 0 && b >= 0
              ? 'both positive — add as usual'
              : a < 0 && b < 0
                ? 'both negative — add their sizes and keep the negative sign'
                : 'one of each sign — subtract the smaller from the larger, keep the sign of the bigger',
        },
      ],
      selfExplanation: selfExpSignFlip(),
    };
    return makeIntProblem('integer-add', `What is \\(${aStr} + ${bStr}\\)?`, sum, walkthrough, rng);
  },
};

export const integerSub: NumericTemplate = {
  id: 'integer-sub',
  tags: ['#negative-integers'],
  generate: (tidyMode, rng = defaultRng) => {
    const range = tidyMode ? 20 : 50;
    const a = randInt(-range, range, rng);
    const b = randInt(-range, range, rng);
    const diff = a - b;
    const aStr = a < 0 ? `(${a})` : String(a);
    const bStr = b < 0 ? `(${b})` : String(b);
    // Sign mistake on "subtract a negative": treating a - (-3) as a - 3.
    const signErrorPattern =
      b < 0
        ? [{ tag: '#sign-error' as const, wrongValue: { kind: 'integer' as const, value: a - Math.abs(b) } }]
        : [];
    const walkthrough: Walkthrough = {
      steps: [
        {
          math: `${aStr} - ${bStr}`,
          caption: 'subtraction; watch for the minus-then-negative pattern',
          visual: 'number-line',
        },
        {
          math: `= ${aStr} + ${-b < 0 ? `(${-b})` : String(-b)}`,
          caption: 'flip the subtraction into addition of the opposite',
        },
        {
          math: `= ${diff}`,
          caption:
            b < 0
              ? 'two minuses became a plus — the result moved up the number line'
              : 'now add as usual',
        },
      ],
      selfExplanation: selfExpSignFlip(),
    };
    const base = makeIntProblem(
      'integer-sub',
      `What is \\(${aStr} - ${bStr}\\)?`,
      diff,
      walkthrough,
      rng,
    );
    return signErrorPattern.length > 0
      ? { ...base, misconceptionPatterns: signErrorPattern }
      : base;
  },
};

export const integerMul: NumericTemplate = {
  id: 'integer-mul',
  tags: ['#negative-integers'],
  generate: (tidyMode, rng = defaultRng) => {
    const range = tidyMode ? 12 : 20;
    const a = randInt(-range, range, rng) || 1;
    const b = randInt(-range, range, rng) || 1;
    const prod = a * b;
    const aStr = a < 0 ? `(${a})` : String(a);
    const bStr = b < 0 ? `(${b})` : String(b);
    const signRule =
      a < 0 && b < 0
        ? 'negative × negative = positive'
        : a >= 0 && b >= 0
          ? 'positive × positive = positive'
          : 'a positive and a negative = negative';
    const walkthrough: Walkthrough = {
      steps: [
        {
          math: `|${a}| \\times |${b}| = ${Math.abs(a)} \\times ${Math.abs(b)} = ${Math.abs(prod)}`,
          caption: 'first ignore the signs and multiply the sizes',
        },
        {
          math: `${aStr} \\times ${bStr} = ${prod}`,
          caption: signRule,
        },
      ],
      selfExplanation: selfExpTwoNegs(),
    };
    const base = makeIntProblem(
      'integer-mul',
      `What is \\(${aStr} \\times ${bStr}\\)?`,
      prod,
      walkthrough,
      rng,
    );
    // Sign error: when exactly one factor is negative, the common mistake is
    // forgetting to apply the negative sign to the product.
    const mixedSign = (a < 0) !== (b < 0);
    if (mixedSign) {
      return {
        ...base,
        misconceptionPatterns: [
          {
            tag: '#sign-error',
            wrongValue: { kind: 'integer', value: Math.abs(prod) },
          },
        ],
      };
    }
    return base;
  },
};

export const negativeIntegerTemplates: NumericTemplate[] = [integerAdd, integerSub, integerMul];
