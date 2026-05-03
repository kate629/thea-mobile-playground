// LegalPage mounts SiteHeader, which pulls firebase via HeaderAccountMenu.
// Stub the same surface SiteHeader's own test stubs.
jest.mock('firebase/auth', () => {
  const noop = () => {};
  return {
    onAuthStateChanged: () => noop,
    onIdTokenChanged: () => noop,
    signOut: () => Promise.resolve(),
  };
});

jest.mock('../../../firebaseConfig', () => ({
  auth: { currentUser: null },
}));

jest.mock('../../auth/accountAuth', () => ({
  signOutUser: jest.fn(() => Promise.resolve()),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import TermsPage from '../TermsPage';
import { AuthGateContext } from '../../auth/AuthGateContext';
import { theme } from '../../../theme';

const noopGate = { requestSignIn: jest.fn() };

function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={['/terms']}>
        <AuthGateContext.Provider value={noopGate}>
          <TermsPage />
        </AuthGateContext.Provider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('TermsPage', () => {
  test('renders the Terms of Use heading and effective date', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: /terms of use/i })).toBeInTheDocument();
    expect(screen.getByText(/effective date: march 12, 2026/i)).toBeInTheDocument();
  });

  test('renders the contact email link', () => {
    renderPage();
    const link = screen.getByRole('link', { name: /hello@givethea\.com/i });
    expect(link).toHaveAttribute('href', 'mailto:hello@givethea.com');
  });
});
