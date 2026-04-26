import React from 'react';
import { OccasionTile } from './OccasionTile';

export default {
  title: 'UI/OccasionTile',
  component: OccasionTile,
  parameters: { happo: { targets: ['chrome-large'] } },
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
    cdnUrl:
      'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2Fd5iqmjRUnHj7ghRlwzqX%2F5c5c15ffbcafb784_orig.webp?alt=media&token=2fe38b28-fb04-4f6c-9279-e8df30b19f99',
    cdnMobileUrl:
      'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2Fd5iqmjRUnHj7ghRlwzqX%2F5c5c15ffbcafb784_mobile.webp?alt=media&token=1cc6a357-39ca-47d3-af66-0f66dca143da',
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
    cdnUrl:
      'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2F1onFYMeXeEusnnKjXgYP%2Fd8792f9b85d6620e_orig.webp?alt=media&token=871d7265-5f6a-4b59-93d0-491bbb30653d',
    cdnMobileUrl:
      'https://firebasestorage.googleapis.com/v0/b/thea-643b1.firebasestorage.app/o/products%2F1onFYMeXeEusnnKjXgYP%2Fd8792f9b85d6620e_mobile.webp?alt=media&token=ece4f50f-a45f-424e-aad1-6225b2d7a90f',
  },
};
