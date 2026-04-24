import type { Preview } from '@storybook/react-webpack5'
import 'happo/storybook/register';
import happoDecorator from 'happo/storybook/decorator';

export const decorators = [happoDecorator];

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
};

export default preview;