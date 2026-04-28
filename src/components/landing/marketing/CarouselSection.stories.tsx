import React from 'react';
import { CarouselSection } from './CarouselSection';
import { SAMPLE_BIRTHDAY_SECTIONS } from './sampleBirthdayCarousels';

export default {
  title: 'Surfaces/Marketing/CarouselSection',
  component: CarouselSection,
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1280,
  margin: '0 auto',
  padding: '40px 24px',
};

const sweetTooth = SAMPLE_BIRTHDAY_SECTIONS[0];

export const SweetTooth = {
  render: (args: React.ComponentProps<typeof CarouselSection>) => (
    <div style={wrapStyle}><CarouselSection {...args} /></div>
  ),
  args: {
    title: sweetTooth.title,
    shortTitle: sweetTooth.shortTitle,
    products: sweetTooth.products,
    isFirstCarousel: true,
  },
};

export const WithChevronArrows = {
  render: (args: React.ComponentProps<typeof CarouselSection>) => (
    <div style={wrapStyle}><CarouselSection {...args} /></div>
  ),
  args: {
    title: sweetTooth.title,
    shortTitle: sweetTooth.shortTitle,
    products: sweetTooth.products,
    canScrollLeft: true,
    canScrollRight: true,
  },
};
