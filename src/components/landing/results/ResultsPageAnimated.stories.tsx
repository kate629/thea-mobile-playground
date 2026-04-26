import React from 'react';
import { ResultsPageAnimated } from './ResultsPageAnimated';

export default {
  title: 'Surfaces/Results/ResultsPageAnimated',
  component: ResultsPageAnimated,
  parameters: { happo: false },
};

export const Live = {
  render: () => <ResultsPageAnimated />,
};
