import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import PrivacyPage from './PrivacyPage';

export default {
  title: 'Surfaces/Legal/PrivacyPage',
  component: PrivacyPage,
  decorators: [
    (Story: React.ComponentType) => (
      <MemoryRouter initialEntries={['/privacy']}>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    happo: { targets: ['chrome-large', 'chrome-small'] },
  },
};

export const Default = {};
