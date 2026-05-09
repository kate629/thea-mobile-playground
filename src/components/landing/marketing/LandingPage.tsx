import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { type Auth } from 'firebase/auth';
import { useAuth } from '../../../theaWeb/firebase/FirebaseContext';
import { useIsSignedIn } from '../../../theaWeb/hooks/useIsSignedIn';
import { HeaderAccountMenu } from '../../../theaWeb/auth/HeaderAccountMenu';
import { SiteHeader } from '../SiteHeader';
import { HeroHeader } from './HeroHeader';
import { HeroHeaderAnimated } from './HeroHeaderAnimated';
import { ValuePropsCard, ValuePropItem } from './ValuePropsCard';
import { OccasionGrid, OCCASION_TILES, OccasionGridTile } from './OccasionGrid';
import { Footer } from './Footer';
import { BrowseMyFriendsSection } from './BrowseMyFriendsSection';
import { SCENARIO_CARDS } from './scenarios';
import { StickyPrimaryCta, StickyPrimaryCtaMobileSpacer } from './StickyPrimaryCta';
import { TestimonialsCarousel } from './TestimonialsCarousel';
import { HomeYourPeopleSection } from '../../../playground/board/HomeYourPeopleSection';
import { SearchPill } from './SearchPill';
import { Button } from '../../ui/Button';
import type { QuizAnswers } from '../quiz/useQuizFlow';
import type { QuizEntryPoint } from '../../../theaWeb/lib/gaPixel';

export interface LandingPageProps {
  /** Pass a frozen HeroHeader for deterministic Happo snapshots. Defaults to
   *  HeroHeaderAnimated for the live experience. */
  heroSlot?: React.ReactNode;
  valuePropsHeading?: React.ReactNode;
  valuePropsItems?: ValuePropItem[];
  occasionsHeading?: string;
  occasionTiles?: OccasionGridTile[];
  onSignInClick?: () => void;
  /**
   * Both the in-page hero CTA and the sticky scroll-CTA route through this
   * single prop; the hero passes `'homepage_hero'` and the sticky passes
   * `'sticky_homepage'` so the parent can thread the surface into the
   * `quiz_start` analytics event (§11.1 entry-point vocabulary).
   */
  onCtaClick?: (entry_point: QuizEntryPoint) => void;
  /**
   * Wired by `LandingRoute` in App.js to `useSubmitGiftFlow`. When the user
   * fills the SearchPill and taps sparkles, this fires with `QuizAnswers`,
   * the route awaits submitGiftFlow, then navigates to the results page.
   */
  onSearchSubmit?: (answers: QuizAnswers) => void;
  /**
   * Story/test override: force the signed-in or signed-out branch without
   * touching Firebase auth. When undefined, the live Firebase auth state
   * decides which branch renders.
   */
  authOverride?: 'signed-in' | 'signed-out' | 'loading';
  /** Override the auth instance for tests. Defaults to the FirebaseProvider's auth. */
  authInstance?: Auth;
}

const Page = styled.div`
  min-height: 100vh;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: ${({ theme }) => theme.font.sans};
`;

/* Zero-height sentinel placed immediately after the hero so an IntersectionObserver
   can drive the sticky CTA. When the sentinel scrolls off the top of the
   viewport, the in-page hero CTA is no longer reachable and the sticky shows. */
const HeroSentinel = styled.div`
  width: 100%;
  height: 1px;
`;

const DEFAULT_VALUE_ITEMS: ValuePropItem[] = [
  {
    emoji: '💡',
    title: 'Build boards for your people',
    body: "Share the little details that make them, them. We'll remember all of it.",
  },
  {
    emoji: '✨',
    title: 'Discover the magic',
    body: "We'll show you curated finds you'd never think to search for.",
  },
  {
    emoji: '🎉',
    title: 'Save now, send anytime',
    body: "Save your favorites. We'll remind you when it's time.",
  },
];

// Responsive line break for the value-props heading: stacks two lines on
// mobile, single line on desktop (bug #49). Plain `<br />` would split the
// line at every viewport — the styled span lets desktop render `inline`
// with a leading space so "You love them. Let it show." reads as one line.
const HeadingBreak = styled.span`
  display: block;
  @media (min-width: 768px) {
    display: inline;
    &::before {
      content: ' ';
    }
  }
`;

const SearchPillSection = styled.section`
  max-width: 720px;
  margin: 32px auto 0;
  padding: 0 16px;
  @media (min-width: 768px) {
    margin-top: 56px;
  }
`;

/**
 * Sentinel placed just below the inline (non-sticky) chrome. When it
 * scrolls out of view, an IntersectionObserver flips `isStuck` so the
 * fixed `<StuckSearchBar>` becomes visible (sheet bug #66).
 */
const StickySentinel = styled.div`
  width: 100%;
  height: 1px;
`;

/**
 * Fixed-position sticky bar for the signed-in homepage. Hidden off-screen
 * via `translateY(-100%)` by default; slides into view when the user has
 * scrolled past the inline chrome. Mirrors the transform-translate pattern
 * `StickyPrimaryCta` uses (more reliable than the `visibility` transition
 * we tried first — visibility has spec-discrete behavior that some browsers
 * collapse to "always hidden" depending on transition setup).
 *
 * Layout differs by viewport:
 *   - Mobile (<768px): just the SearchPill in compact mode (segment-value
 *     text hidden, leaves only WHO / WHAT / LIKES). Wordmark + avatar are
 *     hidden — the inline header still serves them at the top of the page.
 *   - Desktop (≥768px): one row with [wordmark][SearchPill][avatar]. Pill
 *     stays full-width with values since there's room.
 *
 * `z-index` sits above body content but below react-bootstrap Modal
 * (which uses 1050+). Page-color background opaque.
 */
const StuckSearchBar = styled.div<{ $visible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 30;
  background: hsl(var(--background));
  border-bottom: 1px solid hsla(var(--foreground) / 0.06);
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transform: translateY(${({ $visible }) => ($visible ? '0' : '-100%')});
  transition: transform 200ms ease;
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};

  @media (min-width: 768px) {
    padding: 8px 32px;
    gap: 24px;
  }
  @media (min-width: 1024px) {
    padding: 8px 64px;
  }
`;

/* Wordmark inside the stuck bar — desktop-only. Mirrors the SiteHeader's
   wordmark style so the visual identity is consistent. Hidden on mobile
   per Kate's spec — only the pill is sticky there. */
const StuckWordmark = styled.a`
  display: none;
  font-family: ${({ theme }) => theme.font.serif};
  font-style: italic;
  letter-spacing: 0.025em;
  color: hsl(var(--primary));
  font-size: 22px;
  text-decoration: none;
  flex-shrink: 0;
  transition: opacity 200ms ease;
  &:hover {
    opacity: 0.8;
  }
  @media (min-width: 768px) {
    display: inline-flex;
    align-items: center;
  }
`;

const StuckPillSlot = styled.div`
  flex: 1;
  min-width: 0;
`;

const StuckActionsSlot = styled.div`
  display: none;
  @media (min-width: 768px) {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
`;

/**
 * Detects when a sentinel element has scrolled out of the viewport.
 * Used to swap from the inline (non-sticky) signed-in chrome to the
 * fixed `<StuckSearchBar>` once the user scrolls past it. Mirrors the
 * IntersectionObserver pattern in `StickyPrimaryCta.useShowOnScrollPast`.
 *
 * `enabled` is required so the effect re-runs when the sentinel
 * conditionally mounts. Refs aren't reactive — pre-this-fix, the effect
 * fired once on mount, found `sentinelRef.current === null` (sentinel
 * lives inside the `showSignedInLayout` branch which is false during the
 * auth bootstrap), and never re-attached after the sentinel rendered.
 */
function useIsStuck(
  sentinelRef: React.RefObject<HTMLElement | null>,
  enabled: boolean,
): boolean {
  const [isStuck, setIsStuck] = useState(false);
  useEffect(() => {
    if (!enabled) {
      setIsStuck(false);
      return;
    }
    const el = sentinelRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback for environments without IO (jsdom in tests). Stay un-stuck.
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sentinelRef, enabled]);
  return isStuck;
}

// `useIsSignedIn` lifted to src/theaWeb/hooks/useIsSignedIn.ts so the same
// auth read can drive the StickyPrimaryCta's signInSlot on both the homepage
// and occasion pages (sheet bug #59).

export const LandingPage: React.FC<LandingPageProps> = ({
  heroSlot,
  valuePropsHeading = (
    <>
      You love them.<HeadingBreak>Let it show.</HeadingBreak>
    </>
  ),
  valuePropsItems = DEFAULT_VALUE_ITEMS,
  occasionsHeading = 'Browse by occasion',
  occasionTiles = OCCASION_TILES,
  onSignInClick,
  onCtaClick,
  onSearchSubmit,
  authOverride,
  authInstance: authInstanceProp,
}) => {
  const ctxAuth = useAuth();
  const authInstance = authInstanceProp ?? ctxAuth;
  const { ready, signedIn } = useIsSignedIn(authOverride, authInstance);

  // While auth is still resolving, render the marketing hero rather than
  // flashing "Browse my friends" empty state. Persistent users will only
  // see a brief HeroHeader during the auth-listener bootstrap, which
  // beats a layout shift toward an empty grid.
  const showSignedInLayout = ready && signedIn;

  /* Sentinel sits at the bottom edge of the hero region. While it's in the
     viewport, the in-page hero CTA is reachable; once it scrolls off, we show
     the sticky chrome so the primary action is always one tap away. */
  const heroSentinelRef = useRef<HTMLDivElement | null>(null);

  /* Sentinel placed below the inline signed-in chrome. When it scrolls out
     of view the StuckSearchBar fades in. Sheet bug #66. */
  const stuckSentinelRef = useRef<HTMLDivElement | null>(null);
  const isStuck = useIsStuck(stuckSentinelRef, showSignedInLayout);

  return (
    <Page>
      {showSignedInLayout ? (
        <>
          {/* Inline (non-sticky) chrome — SiteHeader + SearchPill at the
              top of page. Scrolls away normally. The StuckSearchBar below
              takes over once the sentinel leaves the viewport (bug #66).
              `compact` is passed unconditionally; CSS only hides the
              segment value text on mobile via media query, so desktop
              keeps the full pill (with values) at the top. Mobile gets
              the compact pill at the top so the sparkle button doesn't
              overflow before the user has even scrolled. */}
          <SiteHeader onSignInClick={onSignInClick} />
          <SearchPillSection aria-label="Search">
            <SearchPill onSubmit={onSearchSubmit} compact />
          </SearchPillSection>
          <StickySentinel ref={stuckSentinelRef} aria-hidden="true" />
          <StuckSearchBar
            $visible={isStuck}
            data-testid="signed-in-stuck-search-bar"
            aria-hidden={!isStuck}
          >
            <StuckWordmark href="/" aria-label="Thea — home">
              thea
            </StuckWordmark>
            <StuckPillSlot>
              <SearchPill onSubmit={onSearchSubmit} compact />
            </StuckPillSlot>
            <StuckActionsSlot>
              <HeaderAccountMenu />
            </StuckActionsSlot>
          </StuckSearchBar>
          <BrowseMyFriendsSection authOverride={authOverride === 'signed-in'
            ? { status: 'signed-in', user: { uid: 'override', initial: 'A' } }
            : undefined} />
        </>
      ) : (
        <>
          <SiteHeader onSignInClick={onSignInClick} />
          {heroSlot ?? (
            <HeroHeaderAnimated onCtaClick={() => onCtaClick?.('homepage_hero')} />
          )}
          <HeroSentinel ref={heroSentinelRef} aria-hidden="true" />
        </>
      )}
      <HomeYourPeopleSection />
      <ValuePropsCard heading={valuePropsHeading} items={valuePropsItems} />
      <TestimonialsCarousel />
      <OccasionGrid heading={occasionsHeading} tiles={occasionTiles} />
      <Footer />
      {/* The StickyPrimaryCta's "Find a gift" + Sign-in slot is for
          signed-out users only. Signed-in users get the sticky SearchPill
          chrome above instead (sheet bug #66). */}
      {!showSignedInLayout && (
        <>
          <StickyPrimaryCtaMobileSpacer />
          <StickyPrimaryCta
            triggerRef={heroSentinelRef}
            onCtaClick={() => onCtaClick?.('sticky_homepage')}
            signInSlot={
              // Hide the secondary "Sign in" CTA once the user is
              // authenticated (sheet bug #59). We wait for `ready` so the
              // bootstrap moment doesn't flash a Sign-in button and then
              // yank it once auth lands. Anon Firebase users still see the
              // CTA — they aren't "signed in" for product purposes.
              ready && !signedIn && onSignInClick ? (
                <Button label="Sign in" variant="ghost" onClick={onSignInClick} />
              ) : null
            }
          />
        </>
      )}
    </Page>
  );
};

/** Convenience export for stories: the View HeroHeader rendered with frozen
 *  props for the Nth scenario. Used by LandingPageFrozen.stories. */
export const FrozenHeroSlot: React.FC<{ scenarioIndex?: number }> = ({ scenarioIndex = 0 }) => {
  const s = SCENARIO_CARDS[scenarioIndex];
  return (
    <HeroHeader
      phrase={s.scenario}
      typedCount={s.scenario.length}
      cursorVisible={false}
      productCard={{
        image: s.productImage,
        name: s.productName,
        brand: s.brand,
        rotation: s.rotation,
      }}
      peekImages={s.peekImages}
      cardVisible
    />
  );
};
