import React from 'react';
import { Textarea } from './Textarea';

export default {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: { happo: { targets: ['chrome-large'] } },
};

const wrapStyle: React.CSSProperties = { width: 480 };

export const Default = {
  render: (args: React.ComponentProps<typeof Textarea>) => (
    <div style={wrapStyle}><Textarea {...args} /></div>
  ),
  args: { placeholder: "Tell us about them..." },
};

export const Filled = {
  render: (args: React.ComponentProps<typeof Textarea>) => (
    <div style={wrapStyle}><Textarea {...args} /></div>
  ),
  args: {
    defaultValue:
      'Loves cookbooks, gardening, and the occasional spontaneous road trip up the coast.',
  },
};

export const Invalid = {
  render: (args: React.ComponentProps<typeof Textarea>) => (
    <div style={wrapStyle}><Textarea {...args} /></div>
  ),
  args: { defaultValue: 'Too short', invalid: true },
};
