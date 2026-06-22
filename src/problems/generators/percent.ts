import type { Problem, Walkthrough, SelfExplanation } from '../../types';
import {
  type NumericTemplate,
  type Rng,
  defaultRng,
  randChoice,
  randInt,
  uid,
} from './common';

const TIDY_PERCENTS = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80] as const;
const LOOSE_PERCENTS = [
  7, 12, 18, 23, 27, 33, 37, 42, 47, 55, 62, 68, 73, 85, 92,
] as const;

function selfExpPercentOf(): SelfExplanation {
  return {
    question: 'What does 35% really mean?',
    options: [
      { label: '35 per 100 — a ratio you multiply', isCorrect: true },
      { label: '35 of something — a count', isCorrect: false },
      { label: '35 added to 100', isCorrect: false },
    ],
  };
}

function selfExpMarkup(): SelfExplanation {
  return {
    question: 'Why do we add the markup percent BACK to 100% before multiplying?',
    options: [
      { label: "because the selling price is the original PLUS the markup", isCorrect: true },
      { label: 'to make the multiplication easier', isCorrect: false },
      { label: 'because 100% is a magic number', isCorrect: false },
    ],
  };
}

function selfExpChange(): SelfExplanation {
  return {
    question: 'Why divide by the ORIGINAL number, not the new one?',
    options: [
      { label: 'percent change always compares against the starting value', isCorrect: true },
      { label: 'because the new number could be zero', isCorrect: false },
      { label: 'it does not matter which one you divide by', isCorrect: false },
    ],
  };
}

function makePctProblem(
  templateId: string,
  text: string,
  canonical: string,
  numericValue: number,
  walkthrough: Walkthrough,
  isCurrency: boolean,
  rng: Rng,
): Problem {
  return {
    id: uid(templateId, rng),
    text,
    answer: isCurrency
      ? {
          form: { kind: 'currency' },
          canonical,
          value: { kind: 'currency', cents: Math.round(numericValue * 100) },
        }
      : {
          form: { kind: 'decimal', places: 2, tolerance: 0.005 },
          canonical,
          value: { kind: 'decimal', value: numericValue },
        },
    walkthrough,
    tags: ['#percent'],
    source: 'generator',
  };
}

export const percentOf: NumericTemplate = {
  id: 'percent-of',
  tags: ['#percent'],
  generate: (tidyMode, rng = defaultRng) => {
    const pct = randChoice(tidyMode ? TIDY_PERCENTS : LOOSE_PERCENTS, rng);
    const whole = tidyMode
      ? randChoice([20, 40, 50, 60, 80, 100, 120, 150, 200] as const, rng)
      : randInt(13, 199, rng);
    const result = (pct / 100) * whole;
    const canonical = `$${result.toFixed(2)}`;
    const walkthrough: Walkthrough = {
      steps: [
        {
          math: `${pct}\\% = \\frac{${pct}}{100} = ${(pct / 100).toFixed(2)}`,
          caption: 'a percent is a fraction over 100; convert to a decimal',
          visual: 'percent-grid',
        },
        {
          math: `${(pct / 100).toFixed(2)} \\times ${whole} = ${result.toFixed(2)}`,
          caption: '"of" means multiply',
        },
      ],
      selfExplanation: selfExpPercentOf(),
    };
    return makePctProblem(
      'percent-of',
      `What is \\(${pct}\\%\\) of \\($${whole}\\)?`,
      canonical,
      result,
      walkthrough,
      true,
      rng,
    );
  },
};

export const percentMarkup: NumericTemplate = {
  id: 'percent-markup',
  tags: ['#percent'],
  generate: (tidyMode, rng = defaultRng) => {
    const pct = randChoice(tidyMode ? TIDY_PERCENTS : LOOSE_PERCENTS, rng);
    const cost = tidyMode
      ? randChoice([10, 12, 15, 20, 24, 25, 30, 40, 50, 60, 80, 100] as const, rng)
      : randInt(13, 87, rng);
    const sellingPrice = cost * (1 + pct / 100);
    const canonical = `$${sellingPrice.toFixed(2)}`;
    const walkthrough: Walkthrough = {
      steps: [
        {
          math: `\\text{multiplier} = 1 + \\frac{${pct}}{100} = ${(1 + pct / 100).toFixed(2)}`,
          caption: 'add the markup to 100% so the original price is included',
          visual: 'percent-grid',
        },
        {
          math: `${cost} \\times ${(1 + pct / 100).toFixed(2)} = ${sellingPrice.toFixed(2)}`,
          caption: 'multiply the cost by the markup multiplier',
        },
      ],
      selfExplanation: selfExpMarkup(),
    };
    return makePctProblem(
      'percent-markup',
      `A jacket cost \\($${cost}\\) wholesale. With a \\(${pct}\\%\\) markup, what is the selling price?`,
      canonical,
      sellingPrice,
      walkthrough,
      true,
      rng,
    );
  },
};

export const percentChange: NumericTemplate = {
  id: 'percent-change',
  tags: ['#percent'],
  generate: (tidyMode, rng = defaultRng) => {
    const original = tidyMode
      ? randChoice([20, 25, 40, 50, 80, 100, 120, 200] as const, rng)
      : randInt(23, 187, rng);
    const pct = randChoice(tidyMode ? TIDY_PERCENTS : LOOSE_PERCENTS, rng);
    const increase = (original * pct) / 100;
    const newValue = original + increase;
    const computedPct = ((newValue - original) / original) * 100;
    const canonical = computedPct.toFixed(0);
    const walkthrough: Walkthrough = {
      steps: [
        {
          math: `\\text{change} = ${newValue.toFixed(2)} - ${original} = ${(newValue - original).toFixed(2)}`,
          caption: 'find how much the value changed',
        },
        {
          math: `\\frac{${(newValue - original).toFixed(2)}}{${original}} = ${((newValue - original) / original).toFixed(4)}`,
          caption: 'divide by the ORIGINAL value, not the new one',
          visual: 'percent-grid',
        },
        {
          math: `${((newValue - original) / original).toFixed(4)} \\times 100 = ${computedPct.toFixed(0)}\\%`,
          caption: 'convert the decimal back to a percent',
        },
      ],
      selfExplanation: selfExpChange(),
    };
    return {
      id: uid('percent-change', rng),
      text: `A price went from \\($${original}\\) to \\($${newValue.toFixed(2)}\\). What is the percent increase?`,
      answer: {
        form: { kind: 'integer' },
        canonical: `${canonical}%`,
        value: { kind: 'integer', value: Math.round(computedPct) },
      },
      walkthrough,
      tags: ['#percent'],
      source: 'generator',
    };
  },
};

export const percentTemplates: NumericTemplate[] = [percentOf, percentMarkup, percentChange];
