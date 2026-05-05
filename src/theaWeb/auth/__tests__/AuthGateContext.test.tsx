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
//
// Phase 2 changed the return type from `User | null` to
// `{user, markerPresent, errorCode?}` — match the new shape so the gate's
// mount-effect doesn't blow up reading `.markerPresent` off null.
jest.mock('../accountAuth', () => ({
  __esModule: true,
  consumeAuthRedirectResult: () =>
    Promise.resolve({ user: null, markerPresent: false }),
}));

// `logEvent` (firing `auth_redirect_lost`) lives in `lib/eventSink`, which
// transitively imports `firebase/functions` (callables). Same TextDecoder
// hazard — stub the sink so this test is firebase-free.
jest.mock('../../lib/eventSink', () => ({
  __esModule: true,
  logEvent: () => {},
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

  // Bug 1 repro — canonical mechanism behind the mobile heart-save bug.
  //
  // Mobile OAuth uses signInWithRedirect, which navigates the entire tab to
  // the provider and back. Returning is a full-page reload: the React tree
  // unmounts and remounts. The onAuthed callback registered before the
  // redirect was held in AuthGateProvider's useRef, which is reinitialized
  // to undefined on the new mount. So even when consumeAuthRedirectResult
  // resolves with a real User on the post-redirect mount, no callback fires
  // — the save action is silently lost.
  //
  // Asserts the bug shape today: a callback registered, then the provider
  // remounts (sim page reload), then a sign-in completes — the original
  // callback never fires. This test PASSES on master because the bug exists.
  // After Phase 2 lands (BE persists save under current uid; merge handles
  // migration), this test stays green because save no longer flows through
  // an in-memory callback at all — the assertion shape doesn't change.
  test('Bug 1: onAuthed callback registered before remount is never fired (mobile redirect repro)', async () => {
    const onAuthed = jest.fn();

    const { unmount } = renderWithGate(<Trigger onAuthed={onAuthed} />);
    fireEvent.click(screen.getByTestId('trigger'));
    expect(screen.getByTestId('modal')).toBeTruthy();

    // Tear down the React tree — equivalent to the post-OAuth tab reload
    // discarding all React state including AuthGateProvider's onAuthedRef.
    unmount();

    // Fresh mount, no Trigger wired up, no requestSignIn called: this is
    // the post-redirect state. consumeAuthRedirectResult ran on mount (mocked
    // to null at the top of the file). Even if it had returned a user, no
    // callback path exists to fire the original onAuthed — there's no
    // persistence between mounts.
    renderWithGate(<div data-testid="post-redirect" />);
    await act(async () => {
      // Let the mount-effect's consumeAuthRedirectResult resolve.
      await Promise.resolve();
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
