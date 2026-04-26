import React from 'react';
import { OccasionGrid, OCCASION_TILES } from './OccasionGrid';

export default {
  title: 'Surfaces/Marketing/OccasionGrid',
  component: OccasionGrid,
};

export const Default = {
  args: {
    heading: 'Browse by occasion',
    tiles: OCCASION_TILES,
  },
};
