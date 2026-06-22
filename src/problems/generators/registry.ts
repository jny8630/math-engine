import type { NumericTemplate } from './common';
import { fractionTemplates } from './fractions';
import { decimalTemplates } from './decimals';
import { percentTemplates } from './percent';
import { negativeIntegerTemplates } from './negative-integers';
import { algebraTemplates } from './algebra';

export const ALL_NUMERIC_TEMPLATES: NumericTemplate[] = [
  ...fractionTemplates,
  ...decimalTemplates,
  ...percentTemplates,
  ...negativeIntegerTemplates,
  ...algebraTemplates,
];
