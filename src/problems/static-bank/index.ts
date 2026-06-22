import type { Problem } from '../../types';
import type { ProblemProvider, ProblemRequest } from '../provider';
import { randChoice } from '../generators/common';

import thrift from './thrift.json';
import sewing from './sewing.json';
import sailing from './sailing.json';
import music from './music.json';
import currency from './currency.json';
import reading from './reading.json';
import pocketMoney from './pocket-money.json';
import spendingSlope from './spending-slope.json';

const ALL_STATIC_PROBLEMS: Problem[] = [
  ...(thrift as Problem[]),
  ...(sewing as Problem[]),
  ...(sailing as Problem[]),
  ...(music as Problem[]),
  ...(currency as Problem[]),
  ...(reading as Problem[]),
  ...(pocketMoney as Problem[]),
  ...(spendingSlope as Problem[]),
];

export const staticBankProvider: ProblemProvider = {
  getProblem(request: ProblemRequest, _tidyMode: boolean): Problem {
    if (request.category !== 'word') {
      throw new Error(
        `staticBankProvider only handles 'word' requests; got ${request.category}`,
      );
    }
    const pool = request.preferTags?.length
      ? ALL_STATIC_PROBLEMS.filter((p) =>
          p.tags.some((t) => request.preferTags!.includes(t)),
        )
      : ALL_STATIC_PROBLEMS;
    const candidates = pool.length > 0 ? pool : ALL_STATIC_PROBLEMS;
    return randChoice(candidates);
  },
  count(category) {
    return category === 'word' ? ALL_STATIC_PROBLEMS.length : 0;
  },
};

export { ALL_STATIC_PROBLEMS };
