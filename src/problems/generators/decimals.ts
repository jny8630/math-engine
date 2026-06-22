import type { Problem, Walkthrough, SelfExplanation } from '../../types';
import {
  type NumericTemplate,
  type Rng,
  defaultRng,
  randInt,
  uid,
} from './common';

// Round to N decimal places, returning a string for stable display.
function round(value: number, places: number): string {
  return value.toFixed(places);
}

function selfExpAddSub(): SelfExplanation {
  return {
    question: 'Why do we line up the decimal points?',
    options: [
      { label: 'so digits in the same place value add together', isCorrect: true },
      { label: 'to make the answer line up neatly', isCorrect: false },
      { label: "it's just a convention", isCorrect: false },
    ],
  };
}

function selfExpMul(): SelfExplanation {
  return {
    question: 'Why do we count the decimal places in the answer?',
    options: [
      { label: 'because each factor adds its decimal places to the product', isCorrect: true },
      { label: 'so the answer looks neat', isCorrect: false },
      { label: 'to avoid carrying digits', isCorrect: false },
    ],
  };
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

function makeDecProblem(
  templateId: string,
  text: string,
  canonical: string,
  numericValue: number,
  places: number,
  walkthrough: Walkthrough,
  rng: Rng,
): Problem {
  return {
    id: uid(templateId, rng),
    text,
    answer: {
      form: { kind: 'decimal', places, tolerance: 0.5 / Math.pow(10, places) },
      canonical,
      value: { kind: 'decimal', value: numericValue },
    },
    walkthrough,
    tags: ['#decimals'],
    source: 'generator',
  };
}

export const decimalAdd: NumericTemplate = {
  id: 'decimal-add',
  tags: ['#decimals'],
  generate: (tidyMode, rng = defaultRng) => {
    const places = tidyMode ? 2 : randInt(2, 3, rng);
    const a = randInt(100, 999, rng) / 100;
    const b = randInt(100, 999, rng) / 100;
    const sum = a + b;
    const canonical = round(sum, places);
    const walkthrough: Walkthrough = {
      steps: [
        {
          math: `\\begin{array}{r} ${a.toFixed(2)} \\\\ + ${b.toFixed(2)} \\\\ \\hline \\end{array}`,
          caption: 'line up the decimal points so each digit is in its proper place',
        },
        {
          math: `${a.toFixed(2)} + ${b.toFixed(2)} = ${sum.toFixed(2)}`,
          caption: 'add column by column, carry as needed',
        },
        ...(tidyMode
          ? []
          : [
              {
                math: `${sum.toFixed(2)} \\approx ${canonical}`,
                caption: `round to ${places} decimal places for the final answer`,
              },
            ]),
      ],
      selfExplanation: selfExpAddSub(),
    };
    return makeDecProblem(
      'decimal-add',
      `What is \\(${a.toFixed(2)} + ${b.toFixed(2)}\\)?`,
      canonical,
      sum,
      places,
      walkthrough,
      rng,
    );
  },
};

export const decimalSub: NumericTemplate = {
  id: 'decimal-sub',
  tags: ['#decimals'],
  generate: (tidyMode, rng = defaultRng) => {
    const places = tidyMode ? 2 : randInt(2, 3, rng);
    let a = randInt(500, 999, rng) / 100;
    let b = randInt(100, 499, rng) / 100;
    if (a < b) [a, b] = [b, a];
    const diff = a - b;
    const canonical = round(diff, places);
    const walkthrough: Walkthrough = {
      steps: [
        {
          math: `\\begin{array}{r} ${a.toFixed(2)} \\\\ - ${b.toFixed(2)} \\\\ \\hline \\end{array}`,
          caption: 'line up the decimal points before subtracting',
        },
        {
          math: `${a.toFixed(2)} - ${b.toFixed(2)} = ${diff.toFixed(2)}`,
          caption: 'subtract column by column, borrow when the top digit is smaller',
        },
        ...(tidyMode
          ? []
          : [
              {
                math: `${diff.toFixed(2)} \\approx ${canonical}`,
                caption: `round to ${places} decimal places for the final answer`,
              },
            ]),
      ],
      selfExplanation: selfExpAddSub(),
    };
    return makeDecProblem(
      'decimal-sub',
      `What is \\(${a.toFixed(2)} - ${b.toFixed(2)}\\)?`,
      canonical,
      diff,
      places,
      walkthrough,
      rng,
    );
  },
};

export const decimalMul: NumericTemplate = {
  id: 'decimal-mul',
  tags: ['#decimals'],
  generate: (tidyMode, rng = defaultRng) => {
    // For tidy mode, single-decimal × single-decimal so the product has at most 2 places.
    const aTenths = randInt(11, 99, rng) / 10; // one decimal place
    const bTenths = randInt(11, 99, rng) / 10;
    const product = Math.round(aTenths * bTenths * 100) / 100;
    const places = tidyMode ? 2 : 2; // 1 + 1 = 2 places exactly
    const canonical = round(product, places);
    const walkthrough: Walkthrough = {
      steps: [
        {
          math: `${aTenths} \\times ${bTenths}`,
          caption: 'first multiply as if there were no decimal points',
        },
        {
          math: `${Math.round(aTenths * 10)} \\times ${Math.round(bTenths * 10)} = ${Math.round(aTenths * 10) * Math.round(bTenths * 10)}`,
          caption: 'drop the decimals and multiply the integers',
        },
        {
          math: `${aTenths} \\times ${bTenths} = ${product.toFixed(2)}`,
          caption: 'each factor has 1 decimal place, so the product has 2',
        },
      ],
      selfExplanation: selfExpMul(),
    };
    return makeDecProblem(
      'decimal-mul',
      `What is \\(${aTenths} \\times ${bTenths}\\)?`,
      canonical,
      product,
      places,
      walkthrough,
      rng,
    );
  },
};

export const decimalTemplates: NumericTemplate[] = [decimalAdd, decimalSub, decimalMul];
