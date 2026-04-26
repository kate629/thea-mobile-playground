import React from 'react';
import { Card } from './Card';

export default {
  title: 'UI/Card',
  component: Card,
  parameters: { happo: { targets: ['chrome-large'] } },
};

export const Cream = {
  args: {
    bg: '#F5F0EB',
    radius: '24px',
    children: <div style={{ textAlign: 'center', fontSize: 18 }}>Cream value-props panel</div>,
  },
};

export const Default = {
  args: {
    children: <div style={{ textAlign: 'center', fontSize: 18 }}>Default card</div>,
  },
};
