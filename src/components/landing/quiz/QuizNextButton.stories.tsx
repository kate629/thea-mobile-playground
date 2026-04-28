import React from 'react';
import { QuizNextButton } from './QuizNextButton';

export default {
  title: 'Surfaces/Quiz/QuizNextButton',
  component: QuizNextButton,
  parameters: { happo: { targets: ['chrome-large', 'chrome-small'] } },
};

export const Enabled = {
  args: {
    label: 'Show me my gifts',
    disabled: false,
  },
};

export const Disabled = {
  args: {
    label: 'Show me my gifts',
    disabled: true,
  },
};
