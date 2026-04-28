import React, { useRef } from 'react';
import styled from 'styled-components';
import { type Auth } from 'firebase/auth';
import { useAuth } from '../../../theaWeb/firebase/FirebaseContext';
import { useIsSignedIn } from '../../../theaWeb/hooks/useIsSignedIn';
import { SiteHeader } from '../SiteHeader';
import { HeroHeader } from './HeroHeader';
import { HeroHeaderAnimated } from './HeroHeaderAnimated';
import { ValuePropsCard, ValuePropItem } from './ValuePropsCard';
import { OccasionGrid, OCCASION_TILES, OccasionGridTile } from './OccasionGrid';
import { Footer } from './Footer';
import { BrowseMyFriendsSection } from './BrowseMyFriendsSection';
import { SCENARIO_CARDS } from './scenarios';
import { StickyPrimaryCta, StickyPrimaryCtaMobileSpacer } from './StickyPrimaryCta';
import { SearchPill } from './SearchPill';
import { Button } from '../../ui/Button';
import type { QuizAnswers } from '../quiz/useQuizFlow';

export interface LandingPageProps {
  /** Pass a frozen HeroHeader for deterministic Happo snapshots. Defaults to
   *  HeroHeaderAnimated for the live experience. */
  heroSlot?: React.ReactNode;
  valuePropsHeading?: React.ReactNode;
  valuePropsItems?: ValuePropItem[];
  occasionsHeading?: string;
  occasionTiles?: OccasionGridTile[];
  onSignInClick?: () => void;
  onCtaClick?: () => void;
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
    title: 'Tell us about them',
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

  return (
    <Page>
      <SiteHeader onSignInClick={onSignInClick} />
      {showSignedInLayout ? (
        <>
          <SearchPillSection aria-label="Search">
            <SearchPill onSubmit={onSearchSubmit} />
          </SearchPillSection>
          <BrowseMyFriendsSection authOverride={authOverride === 'signed-in'
            ? { status: 'signed-in', user: { uid: 'override', initial: 'A' } }
            : undefined} />
        </>
      ) : (
        <>
          {heroSlot ?? <HeroHeaderAnimated onCtaClick={onCtaClick} />}
          <HeroSentinel ref={heroSentinelRef} aria-hidden="true" />
        </>
      )}
      <ValuePropsCard heading={valuePropsHeading} items={valuePropsItems} />
      <OccasionGrid heading={occasionsHeading} tiles={occasionTiles} />
      <Footer />
      <StickyPrimaryCtaMobileSpacer />
      <StickyPrimaryCta
        triggerRef={heroSentinelRef}
        onCtaClick={onCtaClick}
        signInSlot={
          // Hide the secondary "Sign in" CTA once the user is authenticated
          // (sheet bug #59). We wait for `ready` so the bootstrap moment
          // doesn't flash a Sign-in button and then yank it once auth lands.
          // Anon Firebase users still see the CTA — they aren't "signed in"
          // for product purposes.
          ready && !signedIn && onSignInClick ? (
            <Button label="Sign in" variant="ghost" onClick={onSignInClick} />
          ) : null
        }
      />
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
