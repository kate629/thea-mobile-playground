import React from 'react';
import { RadioGroup } from './RadioGroup';

export default {
  title: 'UI/RadioGroup',
  component: RadioGroup,
};

const OPTIONS = [
  { value: 'small', label: 'Small ($1–$25)' },
  { value: 'medium', label: 'Medium ($25–$75)' },
  { value: 'large', label: 'Large ($75+)' },
  { value: 'flexible', label: 'No budget' },
];

export const Vertical = {
  args: {
    name: 'budget',
    value: 'medium',
    options: OPTIONS,
    orientation: 'vertical' as const,
  },
};

export const Horizontal = {
  args: {
    name: 'budget',
    value: 'small',
    options: OPTIONS,
    orientation: 'horizontal' as const,
  },
};

export const Unselected = {
  args: {
    name: 'budget',
    options: OPTIONS,
  },
};
