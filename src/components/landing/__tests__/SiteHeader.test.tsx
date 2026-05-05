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

const noopGate = {
  requestSignIn: jest.fn(),
  redirectFailed: false,
  dismissRedirectFailed: jest.fn(),
};

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

  // Bug #62 regression: without preventDefault, the wordmark <a href="/">
  // navigates immediately on click — bypassing any leave-warning modal the
  // handler tries to open. SiteHeader must call preventDefault internally so
  // every caller is safe by default.
  describe('onLogoClick preventDefault behavior (bug #62)', () => {
    test('calls onLogoClick AND preventDefaults the anchor navigation', () => {
      const onLogoClick = jest.fn();
      renderHeader(<SiteHeader onLogoClick={onLogoClick} />);
      const wordmark = screen.getByText('thea').closest('a')!;
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const prevented = !wordmark.dispatchEvent(event);
      expect(onLogoClick).toHaveBeenCalledTimes(1);
      expect(prevented).toBe(true); // dispatchEvent returns false when default was prevented
      expect(event.defaultPrevented).toBe(true);
    });

    test('without onLogoClick, click falls through to default anchor navigation', () => {
      renderHeader(<SiteHeader logoHref="/home" />);
      const wordmark = screen.getByText('thea').closest('a')!;
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      wordmark.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    });
  });
});
