import React from 'react';
import { StickyPrimaryCta } from './StickyPrimaryCta';
import { Button } from '../../ui/Button';

/**
 * The sticky primary CTA used on the homepage (mobile footer / desktop top
 * bar) and the occasion pages. Stories render with no `triggerRef`, so the
 * sticky is unconditionally visible — exactly the post-scroll state Happo
 * needs to diff.
 */
export default {
  title: 'Surfaces/Marketing/StickyPrimaryCta',
  component: StickyPrimaryCta,
  parameters: { happo: { targets: ['chrome-large', 'chrome-small'] } },
};

const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ minHeight: 240, position: 'relative' }}>{children}</div>
);

export const Default = {
  render: () => (
    <Frame>
      <StickyPrimaryCta onCtaClick={() => undefined} />
    </Frame>
  ),
};

export const CustomLabel = {
  render: () => (
    <Frame>
      <StickyPrimaryCta ctaLabel="Get gift ideas" onCtaClick={() => undefined} />
    </Frame>
  ),
};

/* Component-level visual baseline for the auth-aware sign-in slot
   (sheet bug #59). The page surfaces gate this slot on
   `useIsSignedIn()`; this story locks in the rendered shape when the
   slot is populated, independent of the auth wiring above. */
export const WithSignInSlot = {
  render: () => (
    <Frame>
      <StickyPrimaryCta
        onCtaClick={() => undefined}
        signInSlot={<Button label="Sign in" variant="ghost" onClick={() => undefined} />}
      />
    </Frame>
  ),
};
