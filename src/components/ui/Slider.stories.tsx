import React from 'react';
import { Slider } from './Slider';

export default {
  title: 'UI/Slider',
  component: Slider,
  parameters: { happo: { targets: ['chrome-large'] } },
};

const wrapStyle: React.CSSProperties = { width: 360 };

export const Default = {
  render: (args: React.ComponentProps<typeof Slider>) => (
    <div style={wrapStyle}><Slider {...args} /></div>
  ),
  args: { value: 40, min: 0, max: 100, step: 1 },
};

export const Age = {
  render: (args: React.ComponentProps<typeof Slider>) => (
    <div style={wrapStyle}><Slider {...args} /></div>
  ),
  args: {
    value: 32,
    min: 0,
    max: 100,
    step: 1,
    showValue: true,
    formatValue: (v: number) => `${v}`,
  },
};

export const Budget = {
  render: (args: React.ComponentProps<typeof Slider>) => (
    <div style={wrapStyle}><Slider {...args} /></div>
  ),
  args: {
    value: 75,
    min: 10,
    max: 500,
    step: 5,
    showValue: true,
    formatValue: (v: number) => `$${v}`,
  },
};

export const Disabled = {
  render: (args: React.ComponentProps<typeof Slider>) => (
    <div style={wrapStyle}><Slider {...args} /></div>
  ),
  args: { value: 50, disabled: true },
};
