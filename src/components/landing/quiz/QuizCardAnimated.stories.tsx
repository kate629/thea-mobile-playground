import React from 'react';
import { QuizCardAnimated } from './QuizCardAnimated';

export default {
  title: 'Surfaces/Quiz/QuizCardAnimated',
  component: QuizCardAnimated,
  parameters: { happo: false },
};

const wrapStyle: React.CSSProperties = {
  paddingTop: 32,
  background: 'hsl(var(--background))',
  minHeight: '100vh',
};

export const Live = {
  render: () => (
    <div style={wrapStyle}>
      <QuizCardAnimated
        onSubmit={(answers) => {
          // eslint-disable-next-line no-console
          console.log('Quiz submitted:', answers);
        }}
      />
    </div>
  ),
};
