import React from 'react';
import { SiteHeader } from './SiteHeader';

export default {
  title: 'Landing/SiteHeader',
  component: SiteHeader,
};

export const Unauthed = {
  args: {},
};

export const NoActions = {
  args: {
    actions: null,
  },
};
