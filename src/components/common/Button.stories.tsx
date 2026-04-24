import React from 'react';
import { Button } from './Button';

export default {
  title: 'Common/Button',
  component: Button,
};

export const Primary = {
  args: {
    label: 'Primary',
    variant: 'primary',
  },
};

export const Secondary = {
  args: {
    label: 'Secondary',
    variant: 'secondary',
  },
};

export const Disabled = {
  args: {
    label: 'Disabled',
    disabled: true,
  },
};
