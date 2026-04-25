import React from 'react';
import type { Preview } from '@storybook/react-webpack5';
import 'happo/storybook/register';
import happoDecorator from 'happo/storybook/decorator';
import { ThemeProvider } from 'styled-components';
import { theme } from '../src/theme';
import '../src/index.css';

const themeDecorator = (Story: React.ComponentType) =>
  React.createElement(ThemeProvider, { theme }, React.createElement(Story));

export const decorators = [themeDecorator, happoDecorator];

/* Viewports keyed to our theme breakpoints + Happo snapshot targets.
   The two `Happo:` entries match `chrome-small` and `chrome-large` in
   happo.config.ts so what you preview lines up with what gets snapshot. */
const VIEWPORTS = {
  mobile: {
    name: 'Mobile (375×667 — Happo: chrome-small)',
    styles: { width: '375px', height: '667px' },
    type: 'mobile' as const,
  },
  mobileLarge: {
    name: 'Mobile L (414×896)',
    styles: { width: '414px', height: '896px' },
    type: 'mobile' as const,
  },
  tablet: {
    name: 'Tablet (768×1024 — md)',
    styles: { width: '768px', height: '1024px' },
    type: 'tablet' as const,
  },
  laptop: {
    name: 'Laptop (1024×768 — lg)',
    styles: { width: '1024px', height: '768px' },
    type: 'desktop' as const,
  },
  desktop: {
    name: 'Desktop (1200×900 — Happo: chrome-large)',
    styles: { width: '1200px', height: '900px' },
    type: 'desktop' as const,
  },
  desktopXl: {
    name: 'Desktop XL (1440×900)',
    styles: { width: '1440px', height: '900px' },
    type: 'desktop' as const,
  },
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      options: VIEWPORTS,
    },
  },
  initialGlobals: {
    viewport: { value: 'desktop', isRotated: false },
  },
};

export default preview;
