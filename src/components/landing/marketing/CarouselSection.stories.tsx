import React from 'react';
import { CarouselSection } from './CarouselSection';
import { SAMPLE_BIRTHDAY_SECTIONS } from './sampleBirthdayCarousels';

export default {
  title: 'Landing/Marketing/CarouselSection',
  component: CarouselSection,
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1280,
  margin: '0 auto',
  padding: '40px 24px',
};

const sweetTooth = SAMPLE_BIRTHDAY_SECTIONS[0];
const justAddGuests = SAMPLE_BIRTHDAY_SECTIONS[1];

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

export const WithSavedItems = {
  render: (args: React.ComponentProps<typeof CarouselSection>) => (
    <div style={wrapStyle}><CarouselSection {...args} /></div>
  ),
  args: {
    title: justAddGuests.title,
    shortTitle: justAddGuests.shortTitle,
    products: justAddGuests.products,
    savedProductIds: new Set(['birthday-in-a-bag', 'serving-stand']),
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
