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

import PrivacyPage from '../PrivacyPage';
import { AuthGateContext } from '../../auth/AuthGateContext';
import { theme } from '../../../theme';

const noopGate = { requestSignIn: jest.fn() };

function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={['/privacy']}>
        <AuthGateContext.Provider value={noopGate}>
          <PrivacyPage />
        </AuthGateContext.Provider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('PrivacyPage', () => {
  test('renders the Privacy Policy heading and effective date', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { level: 1, name: /privacy policy/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/effective date: march 12, 2026/i)).toBeInTheDocument();
  });

  test('renders the children-privacy section heading', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { level: 2, name: /children's privacy/i }),
    ).toBeInTheDocument();
  });
});
