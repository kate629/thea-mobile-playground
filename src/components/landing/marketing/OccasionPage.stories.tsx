import React from 'react';
import { OccasionPage } from './OccasionPage';
import { SAMPLE_BIRTHDAY_SECTIONS } from './sampleBirthdayCarousels';

export default {
  title: 'Landing/Marketing/OccasionPage',
  component: OccasionPage,
};

export const Birthday = {
  args: {
    title: 'Birthday Gifts',
    sections: SAMPLE_BIRTHDAY_SECTIONS,
  },
};

export const BirthdayWithSavedItems = {
  args: {
    title: 'Birthday Gifts',
    sections: SAMPLE_BIRTHDAY_SECTIONS,
    savedProductIds: new Set(['magnolia-confetti', 'bucket-list', 'cocktail-kit']),
  },
};
