import React from 'react';
import type { Preview } from '@storybook/react-webpack5';
import 'happo/storybook/register';
import happoDecorator from 'happo/storybook/decorator';
import { isHappoRun } from 'happo/storybook/register';
import { ThemeProvider } from 'styled-components';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { theme } from '../src/theme';
import { FirebaseProvider } from '../src/theaWeb/firebase/FirebaseContext';
import '../src/index.css';

const themeDecorator = (Story: React.ComponentType) =>
  React.createElement(ThemeProvider, { theme }, React.createElement(Story));

/* Inject a stub Firebase context so stories never trigger real
   `getAuth(app)` / `getFirestore(app)` — Storybook builds in CI don't have
   the REACT_APP_FIREBASE_* env vars, and a real call would throw
   `auth/invalid-api-key`. Components that need a specific user state should
   pass a `userOverride` (or equivalent) story prop. Stories that need real
   Firestore data must wrap themselves in a custom FirebaseProvider. */
const fakeAuth = {
  currentUser: null,
  authStateReady: () => Promise.resolve(),
  onAuthStateChanged: () => () => {},
  onIdTokenChanged: () => () => {},
} as unknown as Auth;
const fakeDb = {} as Firestore;
const fakeEnsureAuth = async () => 'story-uid';
const firebaseDecorator = (Story: React.ComponentType) =>
  React.createElement(
    FirebaseProvider,
    { value: { auth: fakeAuth, db: fakeDb, ensureAuth: fakeEnsureAuth } },
    React.createElement(Story)
  );

/* Pause CSS animations + transitions only when Happo is the renderer.
   Dev-mode Storybook keeps animations live (the typewriter cursor still
   blinks, hover transitions still ease). Happo screenshots get the same
   first-frame deterministically every time, so per-snap visual hashes
   stay stable and the cache survives unrelated commits. */
let frozeAlready = false;
const happoFreezeAnimationsDecorator = (Story: React.ComponentType) => {
  if (typeof document !== 'undefined' && !frozeAlready && isHappoRun()) {
    const style = document.createElement('style');
    style.id = 'happo-freeze-animations';
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
    `;
    document.head.appendChild(style);
    frozeAlready = true;
  }
  return React.createElement(Story);
};

export const decorators = [
  firebaseDecorator,
  themeDecorator,
  happoFreezeAnimationsDecorator,
  happoDecorator,
];

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
