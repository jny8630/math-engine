import type { Problem } from '../../types';
import type { ProblemProvider, ProblemRequest } from '../provider';
import { randChoice } from './common';
import { ALL_NUMERIC_TEMPLATES } from './registry';

export const numericGeneratorProvider: ProblemProvider = {
  getProblem(request: ProblemRequest, tidyMode: boolean): Problem {
    if (request.category !== 'numeric') {
      throw new Error(
        `numericGeneratorProvider only handles 'numeric' requests; got ${request.category}`,
      );
    }
    const candidates = request.preferTags?.length
      ? ALL_NUMERIC_TEMPLATES.filter((t) =>
          t.tags.some((tag) => request.preferTags!.includes(tag)),
        )
      : ALL_NUMERIC_TEMPLATES;
    const pool = candidates.length > 0 ? candidates : ALL_NUMERIC_TEMPLATES;
    const template = randChoice(pool);
    return template.generate(tidyMode);
  },
  count(category) {
    return category === 'numeric' ? ALL_NUMERIC_TEMPLATES.length : 0;
  },
};

export { ALL_NUMERIC_TEMPLATES };
