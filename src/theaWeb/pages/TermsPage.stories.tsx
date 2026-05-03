import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import TermsPage from './TermsPage';

export default {
  title: 'Surfaces/Legal/TermsPage',
  component: TermsPage,
  decorators: [
    (Story: React.ComponentType) => (
      <MemoryRouter initialEntries={['/terms']}>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    happo: { targets: ['chrome-large', 'chrome-small'] },
  },
};

export const Default = {};
