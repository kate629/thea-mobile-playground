import React from 'react';
import { HeartButton } from './HeartButton';

export default {
  title: 'UI/HeartButton',
  component: HeartButton,
  parameters: { happo: { targets: ['chrome-large'] } },
};

const wrapStyle: React.CSSProperties = {
  position: 'relative',
  width: 240,
  height: 300,
  background: '#f5f0eb',
  borderRadius: 16,
};

export const Unliked = {
  render: (args: React.ComponentProps<typeof HeartButton>) => (
    <div style={wrapStyle}><HeartButton {...args} /></div>
  ),
  args: { liked: false },
};

export const Liked = {
  render: (args: React.ComponentProps<typeof HeartButton>) => (
    <div style={wrapStyle}><HeartButton {...args} /></div>
  ),
  args: { liked: true },
};
