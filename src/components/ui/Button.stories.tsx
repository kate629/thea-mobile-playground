import React from 'react';
import { Button } from './Button';

export default {
  title: 'UI/Button',
  component: Button,
};

export const Primary = {
  args: {
    label: 'Find a gift',
    variant: 'primary' as const,
    size: 'lg' as const,
  },
};

export const PrimaryMedium = {
  args: {
    label: 'Get ideas',
    variant: 'primary' as const,
    size: 'md' as const,
  },
};

export const Ghost = {
  args: {
    label: 'Sign in',
    variant: 'ghost' as const,
  },
};

export const Disabled = {
  args: {
    label: 'Find a gift',
    variant: 'primary' as const,
    disabled: true,
  },
};
