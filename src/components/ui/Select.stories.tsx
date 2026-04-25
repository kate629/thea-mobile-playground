import React from 'react';
import { Select } from './Select';

export default {
  title: 'UI/Select',
  component: Select,
};

const wrapStyle: React.CSSProperties = { width: 240 };

const RELATIONSHIPS = [
  { value: 'partner', label: 'Partner' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'friend', label: 'Friend' },
  { value: 'coworker', label: 'Coworker' },
];

export const Default = {
  render: (args: React.ComponentProps<typeof Select>) => (
    <div style={wrapStyle}><Select {...args} /></div>
  ),
  args: {
    options: RELATIONSHIPS,
    placeholder: 'Choose relationship',
  },
};

export const WithValue = {
  render: (args: React.ComponentProps<typeof Select>) => (
    <div style={wrapStyle}><Select {...args} /></div>
  ),
  args: {
    options: RELATIONSHIPS,
    defaultValue: 'sibling',
  },
};

export const Invalid = {
  render: (args: React.ComponentProps<typeof Select>) => (
    <div style={wrapStyle}><Select {...args} /></div>
  ),
  args: {
    options: RELATIONSHIPS,
    placeholder: 'Choose relationship',
    invalid: true,
  },
};
