import React from 'react';
import { OccasionProductCard } from './OccasionProductCard';

export default {
  title: 'UI/OccasionProductCard',
  component: OccasionProductCard,
  parameters: { happo: { targets: ['chrome-large'] } },
};

const wrapStyle: React.CSSProperties = { width: 320 };

export const Default = {
  render: (args: React.ComponentProps<typeof OccasionProductCard>) => (
    <div style={wrapStyle}><OccasionProductCard {...args} /></div>
  ),
  args: {
    imageUrl:
      'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FpQMcAiTdF639PKJRmbzY%2F68f2b130c0ea23ac_orig.webp?alt=media&token=39ae7f24-c4f6-4736-a338-d3fe77fc0c08',
    title: 'Magnolia Bakery confetti cake',
    brand: 'Goldbelly',
    price: 62,
  },
};

export const NoBrandNoPrice = {
  render: (args: React.ComponentProps<typeof OccasionProductCard>) => (
    <div style={wrapStyle}><OccasionProductCard {...args} /></div>
  ),
  args: {
    imageUrl:
      'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FyRoYhfjBhCxEnD69u1Ug%2Faab216d7f6edb0fb_orig.webp?alt=media&token=4b6c1239-47d3-40bc-8715-2a1453a254a3',
    title: 'Birthday cookie bundle',
  },
};

export const AsCard = {
  render: (args: React.ComponentProps<typeof OccasionProductCard>) => (
    <div style={wrapStyle}><OccasionProductCard {...args} /></div>
  ),
  args: {
    imageUrl:
      'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2FvqeYukrsFh2tdfuL8okN%2Fb7530aba38d131c7_orig.webp?alt=media&token=6237a1de-f4d2-4134-84e7-08631c8dba9e',
    title: 'Walnut protein brownies',
    brand: "Sweet Addison's",
    price: 36,
    asCard: true,
  },
};
