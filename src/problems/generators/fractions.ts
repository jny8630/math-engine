import type { Problem, Walkthrough, SelfExplanation } from '../../types';
import {
  Fraction,
  type NumericTemplate,
  type Rng,
  defaultRng,
  fracToKatex,
  fracToString,
  randChoice,
  randInt,
  uid,
} from './common';

// Tidy mode: denominators that play nicely together.
const TIDY_DENOMS = [2, 3, 4, 5, 6, 8, 10, 12] as const;
// Loose mode: anything up to 24, including primes like 7, 11, 13.
const LOOSE_DENOMS = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 21, 24,
] as const;

function randomProperFraction(tidyMode: boolean, rng: Rng): Fraction {
  const denoms = tidyMode ? TIDY_DENOMS : LOOSE_DENOMS;
  const d = randChoice(denoms, rng);
  const n = randInt(1, d - 1, rng);
  return new Fraction(n, d);
}

function selfExpAdd(): SelfExplanation {
  return {
    question: 'Why did we need a common denominator?',
    options: [
      { label: 'so we can add the numerators directly', isCorrect: true },
      { label: 'to compare which fraction is bigger', isCorrect: false },
      { label: 'to simplify each fraction', isCorrect: false },
    ],
  };
}

function selfExpSub(): SelfExplanation {
  return {
    question: 'Why did we line up the denominators first?',
    options: [
      { label: "so the parts we're subtracting are the same size", isCorrect: true },
      { label: 'to make the answer smaller', isCorrect: false },
      { label: 'because subtraction always uses bigger numbers', isCorrect: false },
    ],
  };
}

function selfExpMul(): SelfExplanation {
  return {
    question: 'Why does multiplying fractions NOT need a common denominator?',
    options: [
      { label: "we're combining parts, not adding them — multiply across", isCorrect: true },
      { label: 'because the denominators cancel out', isCorrect: false },
      { label: "you do need one — we just didn't use it here", isCorrect: false },
    ],
  };
}

function selfExpDiv(): SelfExplanation {
  return {
    question: 'Why did we flip the second fraction?',
    options: [
      { label: 'dividing by a fraction = multiplying by its reciprocal', isCorrect: true },
      { label: 'to make the math easier', isCorrect: false },
      { label: 'fractions always need to be flipped before dividing', isCorrect: false },
    ],
  };
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

function buildAddWalkthrough(a: Fraction, b: Fraction, sum: Fraction): Walkthrough {
  const lcm = Number(a.d) * Number(b.d) / gcd(Number(a.d), Number(b.d));
  const aN = (Number(a.n) * lcm) / Number(a.d);
  const bN = (Number(b.n) * lcm) / Number(b.d);
  const reduced = sum.toFraction() !== `${aN + bN}/${lcm}`;
  const steps: Walkthrough['steps'] = [
    {
      math: `\\text{LCM}(${Number(a.d)}, ${Number(b.d)}) = ${lcm}`,
      caption: 'because we need a common denominator to add fractions',
      visual: 'bar-model',
    },
    {
      math: `${fracToKatex(a)} = \\frac{${aN}}{${lcm}}, \\quad ${fracToKatex(b)} = \\frac{${bN}}{${lcm}}`,
      caption: 'rewriting each fraction with the common denominator',
    },
    {
      math: `\\frac{${aN}}{${lcm}} + \\frac{${bN}}{${lcm}} = \\frac{${aN + bN}}{${lcm}}`,
      caption: 'now we can add the numerators',
    },
  ];
  if (reduced) {
    steps.push({
      math: `\\frac{${aN + bN}}{${lcm}} = ${fracToKatex(sum)}`,
      caption: 'reducing to lowest terms',
    });
  }
  return { steps, selfExplanation: selfExpAdd() };
}

function buildSubWalkthrough(a: Fraction, b: Fraction, diff: Fraction): Walkthrough {
  const lcm = Number(a.d) * Number(b.d) / gcd(Number(a.d), Number(b.d));
  const aN = (Number(a.n) * lcm) / Number(a.d);
  const bN = (Number(b.n) * lcm) / Number(b.d);
  const rawN = aN - bN;
  const reduced = diff.toFraction() !== `${rawN}/${lcm}`;
  const steps: Walkthrough['steps'] = [
    {
      math: `\\text{LCM}(${Number(a.d)}, ${Number(b.d)}) = ${lcm}`,
      caption: 'because subtraction also needs a common denominator',
      visual: 'bar-model',
    },
    {
      math: `${fracToKatex(a)} = \\frac{${aN}}{${lcm}}, \\quad ${fracToKatex(b)} = \\frac{${bN}}{${lcm}}`,
      caption: 'rewriting with the common denominator',
    },
    {
      math: `\\frac{${aN}}{${lcm}} - \\frac{${bN}}{${lcm}} = \\frac{${rawN}}{${lcm}}`,
      caption: 'subtract the numerators, keep the denominator',
    },
  ];
  if (reduced) {
    steps.push({
      math: `\\frac{${rawN}}{${lcm}} = ${fracToKatex(diff)}`,
      caption: 'reducing to lowest terms',
    });
  }
  return { steps, selfExplanation: selfExpSub() };
}

function buildMulWalkthrough(a: Fraction, b: Fraction, prod: Fraction): Walkthrough {
  const rawN = Number(a.n) * Number(b.n);
  const rawD = Number(a.d) * Number(b.d);
  const reduced = prod.toFraction() !== `${rawN}/${rawD}`;
  const steps: Walkthrough['steps'] = [
    {
      math: `${fracToKatex(a)} \\times ${fracToKatex(b)} = \\frac{${Number(a.n)} \\times ${Number(b.n)}}{${Number(a.d)} \\times ${Number(b.d)}}`,
      caption: 'to multiply fractions, multiply numerators and denominators across',
    },
    {
      math: `= \\frac{${rawN}}{${rawD}}`,
      caption: 'do the multiplication on top and bottom',
    },
  ];
  if (reduced) {
    steps.push({
      math: `\\frac{${rawN}}{${rawD}} = ${fracToKatex(prod)}`,
      caption: 'reducing to lowest terms',
    });
  }
  return { steps, selfExplanation: selfExpMul() };
}

function buildDivWalkthrough(a: Fraction, b: Fraction, quot: Fraction): Walkthrough {
  const flippedN = Number(b.d);
  const flippedD = Number(b.n);
  const rawN = Number(a.n) * flippedN;
  const rawD = Number(a.d) * flippedD;
  const reduced = quot.toFraction() !== `${rawN}/${rawD}`;
  const steps: Walkthrough['steps'] = [
    {
      math: `${fracToKatex(a)} \\div ${fracToKatex(b)} = ${fracToKatex(a)} \\times \\frac{${flippedN}}{${flippedD}}`,
      caption: 'dividing by a fraction is the same as multiplying by its reciprocal',
    },
    {
      math: `= \\frac{${Number(a.n)} \\times ${flippedN}}{${Number(a.d)} \\times ${flippedD}} = \\frac{${rawN}}{${rawD}}`,
      caption: 'now multiply across',
    },
  ];
  if (reduced) {
    steps.push({
      math: `\\frac{${rawN}}{${rawD}} = ${fracToKatex(quot)}`,
      caption: 'reducing to lowest terms',
    });
  }
  return { steps, selfExplanation: selfExpDiv() };
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

function makeProblem(
  templateId: string,
  text: string,
  result: Fraction,
  walkthrough: Walkthrough,
  rng: Rng,
): Problem {
  return {
    id: uid(templateId, rng),
    text,
    answer: {
      form: { kind: 'fraction', allowUnreduced: false },
      canonical: fracToString(result),
      value: { kind: 'fraction', n: Number(result.n) * result.s, d: Number(result.d) },
    },
    walkthrough,
    tags: ['#fractions'],
    source: 'generator',
  };
}

export const fractionAdd: NumericTemplate = {
  id: 'fraction-add',
  tags: ['#fractions'],
  generate: (tidyMode, rng = defaultRng) => {
    const a = randomProperFraction(tidyMode, rng);
    const b = randomProperFraction(tidyMode, rng);
    const sum = a.add(b);
    const base = makeProblem(
      'fraction-add',
      `What is \\(${fracToKatex(a)} + ${fracToKatex(b)}\\)?`,
      sum,
      buildAddWalkthrough(a, b, sum),
      rng,
    );
    return {
      ...base,
      misconceptionPatterns: [
        {
          tag: '#added-num-and-denom',
          wrongValue: {
            kind: 'fraction',
            n: Number(a.n) + Number(b.n),
            d: Number(a.d) + Number(b.d),
          },
        },
      ],
    };
  },
};

export const fractionSub: NumericTemplate = {
  id: 'fraction-sub',
  tags: ['#fractions'],
  generate: (tidyMode, rng = defaultRng) => {
    // Ensure a >= b so the answer is non-negative.
    let a = randomProperFraction(tidyMode, rng);
    let b = randomProperFraction(tidyMode, rng);
    if (a.compare(b) < 0) [a, b] = [b, a];
    const diff = a.sub(b);
    return makeProblem(
      'fraction-sub',
      `What is \\(${fracToKatex(a)} - ${fracToKatex(b)}\\)?`,
      diff,
      buildSubWalkthrough(a, b, diff),
      rng,
    );
  },
};

export const fractionMul: NumericTemplate = {
  id: 'fraction-mul',
  tags: ['#fractions'],
  generate: (tidyMode, rng = defaultRng) => {
    const a = randomProperFraction(tidyMode, rng);
    const b = randomProperFraction(tidyMode, rng);
    const prod = a.mul(b);
    return makeProblem(
      'fraction-mul',
      `What is \\(${fracToKatex(a)} \\times ${fracToKatex(b)}\\)?`,
      prod,
      buildMulWalkthrough(a, b, prod),
      rng,
    );
  },
};

export const fractionDiv: NumericTemplate = {
  id: 'fraction-div',
  tags: ['#fractions'],
  generate: (tidyMode, rng = defaultRng) => {
    const a = randomProperFraction(tidyMode, rng);
    const b = randomProperFraction(tidyMode, rng);
    const quot = a.div(b);
    const base = makeProblem(
      'fraction-div',
      `What is \\(${fracToKatex(a)} \\div ${fracToKatex(b)}\\)?`,
      quot,
      buildDivWalkthrough(a, b, quot),
      rng,
    );
    return {
      ...base,
      misconceptionPatterns: [
        {
          // Common mistake: multiply across instead of inverting the divisor.
          tag: '#didnt-invert-on-divide',
          wrongValue: {
            kind: 'fraction',
            n: Number(a.n) * Number(b.n),
            d: Number(a.d) * Number(b.d),
          },
        },
      ],
    };
  },
};

export const fractionTemplates: NumericTemplate[] = [
  fractionAdd,
  fractionSub,
  fractionMul,
  fractionDiv,
];
