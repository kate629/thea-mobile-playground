import React from 'react';
import { Label } from './Label';

export default {
  title: 'UI/Label',
  component: Label,
  parameters: { happo: { targets: ['chrome-large'] } },
};

export const Default = {
  args: { children: 'Email' },
};

export const Required = {
  args: { children: 'Email', required: true },
};
