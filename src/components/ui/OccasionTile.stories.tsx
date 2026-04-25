import React from 'react';
import { OccasionTile } from './OccasionTile';

export default {
  title: 'UI/OccasionTile',
  component: OccasionTile,
};

const wrapStyle: React.CSSProperties = { width: 240 };

export const MothersDay = {
  render: (args: React.ComponentProps<typeof OccasionTile>) => (
    <div style={wrapStyle}><OccasionTile {...args} /></div>
  ),
  args: {
    title: "Mother's Day",
    href: '/occasion/mothers_day',
    imageUrl:
      'https://furbishstudio.com/cdn/shop/files/244A4176_2048x.jpg?v=1762389625',
  },
};

export const Birthday = {
  render: (args: React.ComponentProps<typeof OccasionTile>) => (
    <div style={wrapStyle}><OccasionTile {...args} /></div>
  ),
  args: {
    title: 'Birthday',
    href: '/occasion/birthday',
    imageUrl:
      'https://www.knotandbow.com/cdn/shop/products/BirthdayBag_087_1024x1024.jpg?v=1622925697',
  },
};
