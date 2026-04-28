// HeaderAccountMenu pulls in firebase via firebaseConfig + accountAuth — stub
// the same surface its own test stubs to keep jsdom from blowing up.
jest.mock('firebase/auth', () => {
  const noop = () => {};
  return {
    // Both observers must be present — HeaderAccountMenu now subscribes to
    // BOTH for cold-load and in-place link coverage. Each must return a
    // callable unsubscribe so React's cleanup doesn't TypeError.
    onAuthStateChanged: () => noop,
    onIdTokenChanged: () => noop,
    signOut: () => Promise.resolve(),
  };
});

jest.mock('../../../firebaseConfig', () => ({
  auth: { currentUser: null },
}));

jest.mock('../../../theaWeb/auth/accountAuth', () => ({
  signOutUser: jest.fn(() => Promise.resolve()),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { SiteHeader } from '../SiteHeader';
import { AuthGateContext } from '../../../theaWeb/auth/AuthGateContext';
import { theme } from '../../../theme';

const noopGate = { requestSignIn: jest.fn() };

function renderHeader(ui: React.ReactElement) {
  return render(
    <ThemeProvider theme={theme}>
      <AuthGateContext.Provider value={noopGate}>{ui}</AuthGateContext.Provider>
    </ThemeProvider>,
  );
}

describe('SiteHeader', () => {
  test('default actions renders HeaderAccountMenu (Sign in pill for anon)', () => {
    renderHeader(<SiteHeader />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('passing actions={null} renders nothing in the actions slot', () => {
    renderHeader(<SiteHeader actions={null} />);
    expect(screen.queryByRole('button', { name: /sign in/i })).toBeNull();
  });

  test('explicit actions override the default HeaderAccountMenu', () => {
    renderHeader(
      <SiteHeader actions={<button>Custom action</button>} />,
    );
    expect(screen.getByRole('button', { name: /custom action/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign in/i })).toBeNull();
  });

  test('wordmark links to logoHref', () => {
    renderHeader(<SiteHeader logoHref="/home" />);
    const wordmark = screen.getByText('thea').closest('a');
    expect(wordmark).toHaveAttribute('href', '/home');
  });
});
