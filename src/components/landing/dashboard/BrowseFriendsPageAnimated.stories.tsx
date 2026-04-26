import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrowseFriendsPageAnimated } from './BrowseFriendsPageAnimated';
import { MockAuthAdapter } from './mockAuth';
import { makeDelayedMockPreviewLoader, SAMPLE_DASHBOARD_PEOPLE } from './sampleDashboardData';
import { AuthState } from './types';

export default {
  title: 'Landing/Dashboard/BrowseFriendsPageAnimated',
  component: BrowseFriendsPageAnimated,
  parameters: { happo: false, layout: 'fullscreen' },
};

/**
 * Live container demo. Auth state is controlled via three buttons in
 * the toolbar above the page; preview-loader delay is set to 600ms so
 * the per-tile shimmer-to-collage transition is visible.
 */
export const Live = {
  render: () => {
    // Stable instances across renders.
    const authAdapter = useRef(new MockAuthAdapter({ status: 'loading' })).current;
    const previewLoader = useMemo(() => makeDelayedMockPreviewLoader(600), []);
    const [, force] = useState(0);

    const flip = (next: AuthState) => {
      authAdapter.setState(next);
      force((n) => n + 1); // re-render the controls so active button highlights.
    };

    const ToolbarButton: React.FC<{
      label: string;
      active: boolean;
      onClick: () => void;
    }> = ({ label, active, onClick }) => (
      <button
        onClick={onClick}
        type="button"
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid #e5e0d8',
          background: active ? '#B56B58' : '#fff',
          color: active ? '#fff' : '#3D3530',
          cursor: 'pointer',
          fontSize: 13,
        }}
      >
        {label}
      </button>
    );

    const current = authAdapter.getState();

    return (
      <div>
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            padding: 12,
            display: 'flex',
            gap: 8,
            background: '#FAF7F2',
            borderBottom: '1px solid #e5e0d8',
          }}
        >
          <ToolbarButton
            label="Loading"
            active={current.status === 'loading'}
            onClick={() => flip({ status: 'loading' })}
          />
          <ToolbarButton
            label="Signed out"
            active={current.status === 'signed-out'}
            onClick={() =>
              flip({
                status: 'signed-out',
                onRequestSignIn: () =>
                  flip({
                    status: 'signed-in',
                    user: { uid: 'demo', displayName: 'Manuel', initial: 'M' },
                  }),
              })
            }
          />
          <ToolbarButton
            label="Signed in"
            active={current.status === 'signed-in'}
            onClick={() =>
              flip({
                status: 'signed-in',
                user: { uid: 'demo', displayName: 'Manuel', initial: 'M' },
              })
            }
          />
        </div>

        <BrowseFriendsPageAnimated
          authAdapter={authAdapter}
          previewLoader={previewLoader}
          people={SAMPLE_DASHBOARD_PEOPLE}
          onAddSomeoneClick={() => alert('Add someone')}
          onPersonClick={(p) => alert(`Open ${p.name}`)}
          onSparkle={() => alert('Search!')}
        />
      </div>
    );
  },
};

/**
 * Mimics a real page load: starts in `loading`, transitions to `signed-in`
 * after 700ms. With the 600ms preview-loader delay, the per-tile
 * shimmer-to-collage transition fires naturally on top of the auth flip.
 */
export const AutoLifecycle = {
  render: () => {
    const authAdapter = useRef(new MockAuthAdapter({ status: 'loading' })).current;
    const previewLoader = useMemo(() => makeDelayedMockPreviewLoader(600), []);

    useEffect(() => {
      const t = setTimeout(() => {
        authAdapter.setState({
          status: 'signed-in',
          user: { uid: 'demo', displayName: 'Manuel', initial: 'M' },
        });
      }, 700);
      return () => clearTimeout(t);
    }, [authAdapter]);

    return (
      <BrowseFriendsPageAnimated
        authAdapter={authAdapter}
        previewLoader={previewLoader}
        people={SAMPLE_DASHBOARD_PEOPLE}
        onAddSomeoneClick={() => alert('Add someone')}
        onPersonClick={(p) => alert(`Open ${p.name}`)}
      />
    );
  },
};

/**
 * Starts signed-out so the sign-in CTA card is the focus. Clicking either
 * "Sign in" button (header or card) flips the adapter to signed-in via the
 * adapter's built-in `requestSignIn`, demonstrating that the View
 * branches cleanly when auth state changes.
 */
export const SignedOutToSignedIn = {
  render: () => {
    const authAdapter = useRef(
      new MockAuthAdapter({
        status: 'signed-out',
        onRequestSignIn: () => {},
      }),
    ).current;
    const previewLoader = useMemo(() => makeDelayedMockPreviewLoader(600), []);
    const [, force] = useState(0);

    // The initial signed-out state's onRequestSignIn was a no-op closure,
    // so we replace it with one that actually flips the adapter and
    // re-renders.
    useEffect(() => {
      authAdapter.setState({
        status: 'signed-out',
        onRequestSignIn: () => {
          authAdapter.requestSignIn();
          force((n) => n + 1);
        },
      });
    }, [authAdapter]);

    return (
      <BrowseFriendsPageAnimated
        authAdapter={authAdapter}
        previewLoader={previewLoader}
        people={SAMPLE_DASHBOARD_PEOPLE}
        onAddSomeoneClick={() => alert('Add someone')}
        onPersonClick={(p) => alert(`Open ${p.name}`)}
      />
    );
  },
};
