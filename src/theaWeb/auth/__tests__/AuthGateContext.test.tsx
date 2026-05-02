import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { AuthGateProvider, useAuthGate } from '../AuthGateContext';
import { theme } from '../../../theme';

// AuthGateProvider's mount-effect calls `consumeAuthRedirectResult` from
// accountAuth, which transitively loads firebase/auth → undici → TextDecoder
// (not polyfilled in Jest's jsdom env). Stub the function so the test stays
// firebase-free. Plain function form, not jest.fn().mockResolvedValue, to
// sidestep a hoisting quirk where jest.fn() inside the factory returns
// undefined at evaluation time.
jest.mock('../accountAuth', () => ({
  __esModule: true,
  consumeAuthRedirectResult: () => Promise.resolve(null),
}));

// SignInModal pulls in firebase via accountAuth — replace it with a tiny stub
// that exposes the open / mode / onAuthed surface so we can assert the gate
// wiring without Firebase.
jest.mock('../SignInModal', () => {
  const ReactMod = require('react');
  return {
    __esModule: true,
    SignInModal: function SignInModalStub(props: any) {
      if (!props.open) return null;
      return ReactMod.createElement(
        'div',
        { 'data-testid': 'modal' },
        ReactMod.createElement('span', { 'data-testid': 'mode' }, props.defaultMode),
        ReactMod.createElement(
          'button',
          {
            'data-testid': 'succeed',
            onClick: async () => {
              await props.onAuthed?.();
              props.onOpenChange(false);
            },
          },
          'succeed',
        ),
        ReactMod.createElement(
          'button',
          {
            'data-testid': 'cancel',
            onClick: () => props.onOpenChange(false),
          },
          'cancel',
        ),
      );
    },
  };
});

const Trigger: React.FC<{
  mode?: 'signin' | 'signup';
  onAuthed?: () => void | Promise<void>;
}> = ({ mode, onAuthed }) => {
  const { requestSignIn } = useAuthGate();
  return (
    <button data-testid="trigger" onClick={() => requestSignIn({ mode, onAuthed })}>
      open
    </button>
  );
};

function renderWithGate(child: React.ReactNode) {
  return render(
    <ThemeProvider theme={theme}>
      <AuthGateProvider>{child}</AuthGateProvider>
    </ThemeProvider>,
  );
}

describe('AuthGateContext', () => {
  test('opens the modal in the requested mode', () => {
    renderWithGate(<Trigger mode="signin" />);
    fireEvent.click(screen.getByTestId('trigger'));
    expect(screen.getByTestId('mode').textContent).toBe('signin');
  });

  test('defaults to signup when mode is omitted', () => {
    renderWithGate(<Trigger />);
    fireEvent.click(screen.getByTestId('trigger'));
    expect(screen.getByTestId('mode').textContent).toBe('signup');
  });

  test('fires onAuthed exactly once and closes the modal', async () => {
    const onAuthed = jest.fn();
    renderWithGate(<Trigger onAuthed={onAuthed} />);
    fireEvent.click(screen.getByTestId('trigger'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('succeed'));
    });
    expect(onAuthed).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('modal')).toBeNull();
  });

  test('does not run onAuthed when the modal is cancelled', async () => {
    const onAuthed = jest.fn();
    renderWithGate(<Trigger onAuthed={onAuthed} />);
    fireEvent.click(screen.getByTestId('trigger'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('cancel'));
    });
    expect(onAuthed).not.toHaveBeenCalled();
  });

  test('does not replay a stale onAuthed when re-opened with a different callback', async () => {
    const oldOnAuthed = jest.fn();
    const newOnAuthed = jest.fn();
    const Switcher: React.FC = () => {
      const [cb, setCb] = React.useState<(() => void) | undefined>(() => oldOnAuthed);
      const { requestSignIn } = useAuthGate();
      return (
        <>
          <button data-testid="open" onClick={() => requestSignIn({ onAuthed: cb })}>
            open
          </button>
          <button
            data-testid="swap"
            onClick={() => setCb(() => newOnAuthed)}
          >
            swap
          </button>
        </>
      );
    };

    renderWithGate(<Switcher />);
    fireEvent.click(screen.getByTestId('open'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('cancel'));
    });
    fireEvent.click(screen.getByTestId('swap'));
    fireEvent.click(screen.getByTestId('open'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('succeed'));
    });
    expect(oldOnAuthed).not.toHaveBeenCalled();
    expect(newOnAuthed).toHaveBeenCalledTimes(1);
  });
});
