import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LandingPage } from './marketing/LandingPage';
import { QuizCardAnimated } from './quiz/QuizCardAnimated';
import { ResultsPageAnimated } from './results/ResultsPageAnimated';
import { BrowseFriendsPageAnimated } from './dashboard/BrowseFriendsPageAnimated';
import { MockAuthAdapter } from './dashboard/mockAuth';
import {
  SAMPLE_DASHBOARD_PEOPLE,
  makeDelayedMockPreviewLoader,
  instantMockPreviewLoader,
} from './dashboard/sampleDashboardData';
import { AuthState } from './dashboard/types';

/**
 * Top-level "Pages" group. Each story here wires the fully-assembled,
 * interactive version of a top-level surface so reviewers can click through
 * the real UX without drilling into individual component folders.
 *
 * These are Live containers — flagged `happo: false` — meant for manual
 * exploration. The frozen-args Happo targets live alongside each surface's
 * own folder (Landing/Marketing/, Landing/Quiz/, Landing/Results/,
 * Landing/Dashboard/).
 */
export default {
  title: 'Pages',
  parameters: {
    layout: 'fullscreen',
    happo: false,
  },
};

/* ============================================================
   Marketing Landing (signed-out homepage)
   ============================================================ */
export const MarketingLanding = {
  name: 'Marketing Landing',
  render: () => (
    <LandingPage
      onSignInClick={() => alert('Sign in')}
      onCtaClick={() => alert('Find a gift')}
    />
  ),
};

/* ============================================================
   Quiz Flow (relationship → kid/adult → age → interests → loading)
   ============================================================ */
export const QuizFlow = {
  name: 'Quiz Flow',
  render: () => {
    const [submitted, setSubmitted] = useState<string | null>(null);
    return (
      <div style={{ minHeight: '100vh', background: 'hsl(var(--background))', padding: '40px 0' }}>
        <QuizCardAnimated
          onSubmit={(answers) => {
            setSubmitted(JSON.stringify(answers, null, 2));
          }}
        />
        {submitted && (
          <pre
            style={{
              maxWidth: 768,
              margin: '24px auto',
              padding: 16,
              borderRadius: 12,
              background: '#FAF7F2',
              border: '1px solid #E8E5E0',
              fontSize: 12,
            }}
          >
            Submitted answers:{'\n'}
            {submitted}
          </pre>
        )}
      </div>
    );
  },
};

/* ============================================================
   Results (Discover / Saved / Purchased tabs, full Live wire)
   ============================================================ */
export const Results = {
  name: 'Results',
  render: () => <ResultsPageAnimated />,
};

/* ============================================================
   Dashboard — three auth-state variants
   ============================================================ */

const buildSignedInAdapter = () =>
  new MockAuthAdapter({
    status: 'signed-in',
    user: { uid: 'demo', displayName: 'Manuel', initial: 'M' },
  });

export const DashboardSignedIn = {
  name: 'Dashboard / Signed In',
  render: () => {
    const adapter = useRef(buildSignedInAdapter()).current;
    return (
      <BrowseFriendsPageAnimated
        authAdapter={adapter}
        previewLoader={instantMockPreviewLoader}
        people={SAMPLE_DASHBOARD_PEOPLE}
        onAddSomeoneClick={() => alert('Add someone')}
        onPersonClick={(p) => alert(`Open ${p.name}`)}
        onSparkle={() => alert('Search!')}
      />
    );
  },
};

export const DashboardSignedOut = {
  name: 'Dashboard / Signed Out',
  render: () => {
    const adapter = useRef(
      new MockAuthAdapter({
        status: 'signed-out',
        onRequestSignIn: () => {},
      }),
    ).current;
    const [, force] = useState(0);
    // Replace the no-op closure so clicking sign-in actually flips the adapter.
    useEffect(() => {
      adapter.setState({
        status: 'signed-out',
        onRequestSignIn: () => {
          adapter.requestSignIn();
          force((n) => n + 1);
        },
      });
    }, [adapter]);
    return (
      <BrowseFriendsPageAnimated
        authAdapter={adapter}
        previewLoader={makeDelayedMockPreviewLoader(600)}
        people={SAMPLE_DASHBOARD_PEOPLE}
        onAddSomeoneClick={() => alert('Add someone')}
        onPersonClick={(p) => alert(`Open ${p.name}`)}
      />
    );
  },
};

export const DashboardLoading = {
  name: 'Dashboard / Loading',
  render: () => {
    const adapter = useRef(new MockAuthAdapter({ status: 'loading' })).current;
    return (
      <BrowseFriendsPageAnimated
        authAdapter={adapter}
        previewLoader={makeDelayedMockPreviewLoader(600)}
        people={SAMPLE_DASHBOARD_PEOPLE}
      />
    );
  },
};

/**
 * Demo of a real page-load sequence: starts loading, transitions to
 * signed-in after 700ms; preview tiles transition from shimmer to collage
 * over their 600ms loader delay. Useful for QA-ing the assembled lifecycle.
 */
export const DashboardAutoLifecycle = {
  name: 'Dashboard / Auto Lifecycle',
  render: () => {
    const adapter = useRef(new MockAuthAdapter({ status: 'loading' })).current;
    const previewLoader = useMemo(() => makeDelayedMockPreviewLoader(600), []);
    useEffect(() => {
      const t = setTimeout(() => {
        adapter.setState({
          status: 'signed-in',
          user: { uid: 'demo', displayName: 'Manuel', initial: 'M' },
        });
      }, 700);
      return () => clearTimeout(t);
    }, [adapter]);
    return (
      <BrowseFriendsPageAnimated
        authAdapter={adapter}
        previewLoader={previewLoader}
        people={SAMPLE_DASHBOARD_PEOPLE}
        onAddSomeoneClick={() => alert('Add someone')}
        onPersonClick={(p) => alert(`Open ${p.name}`)}
      />
    );
  },
};

/**
 * Multi-state toggle so reviewers can flip between auth states from one
 * place. Same content as `Dashboard / Auto Lifecycle` but with the
 * lifecycle in the reviewer's hands.
 */
export const DashboardManualToggle = {
  name: 'Dashboard / Manual Auth Toggle',
  render: () => {
    const adapter = useRef(new MockAuthAdapter({ status: 'loading' })).current;
    const previewLoader = useMemo(() => makeDelayedMockPreviewLoader(600), []);
    const [, force] = useState(0);
    const flip = (next: AuthState) => {
      adapter.setState(next);
      force((n) => n + 1);
    };
    const current = adapter.getState();
    const Btn: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({
      label,
      active,
      onClick,
    }) => (
      <button
        type="button"
        onClick={onClick}
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
          <Btn
            label="Loading"
            active={current.status === 'loading'}
            onClick={() => flip({ status: 'loading' })}
          />
          <Btn
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
          <Btn
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
          authAdapter={adapter}
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
