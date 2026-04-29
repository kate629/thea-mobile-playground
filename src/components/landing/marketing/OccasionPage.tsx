import React, { useRef } from 'react';
import styled from 'styled-components';
import { type Auth } from 'firebase/auth';
import { useAuth } from '../../../theaWeb/firebase/FirebaseContext';
import { SiteHeader } from '../SiteHeader';
import { Footer } from './Footer';
import { CarouselSection, CarouselProduct } from './CarouselSection';
import { StickyPrimaryCta, StickyPrimaryCtaMobileSpacer } from './StickyPrimaryCta';
import { Button } from '../../ui/Button';
import {
  useIsSignedIn,
  type AuthOverride,
} from '../../../theaWeb/hooks/useIsSignedIn';

export interface OccasionPageSection {
  title: string;
  shortTitle?: string;
  slug: string;
  products: CarouselProduct[];
}

export interface OccasionPageProps {
  /** Page H1 (e.g. "Birthday Gifts"). */
  title: string;
  sections: OccasionPageSection[];
  onSignInClick?: () => void;
  onProductClick?: (product: CarouselProduct, sectionSlug: string, indexInSection: number) => void;
  /** Click handler for the sticky "Find a gift" CTA. Same action a homepage
   *  hero CTA fires (route to /quiz). Optional so stories can omit it. */
  onCtaClick?: () => void;
  /** Story/test override: force the signed-in or signed-out branch without
   *  touching Firebase auth. */
  authOverride?: AuthOverride;
  /** Override the auth instance for tests/stories. Defaults to the
   *  FirebaseProvider's auth via `useAuth()`. */
  authInstance?: Auth;
  /** Story override: replace the default `<HeaderAccountMenu />` in the
   *  SiteHeader so a signed-in story can render the header in a faithful
   *  signed-in state too (the storybook fakeAuth otherwise leaves the
   *  header reading currentUser=null). Production callers omit this. */
  headerActions?: React.ReactNode;
  /** Optional ReactNode rendered between the 2nd and 3rd carousel sections.
   *  Used by Mother's Day to inject a quiz CTA banner mid-page. */
  midCarouselSlot?: React.ReactNode;
  /** URL slug for this guide (e.g. `mothers_day`). Threads through to each
   *  CarouselSection so impression / scroll / product-click events carry
   *  the `occasion` GA4 param. */
  occasion?: string;
}

const Page = styled.div`
  min-height: 100vh;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: ${({ theme }) => theme.font.sans};
`;

const Inner = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  @media (min-width: 1024px) { padding: 0 32px; }
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: hsl(var(--foreground));
  margin: 24px 0 32px;
  line-height: 1.2;
  letter-spacing: -0.02em;
  @media (min-width: 768px) {
    font-size: 36px;
    margin: 32px 0 40px;
  }
`;

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;
`;

const Disclaimer = styled.p`
  margin: 56px 0 24px;
  text-align: center;
  font-size: 13px;
  color: hsl(var(--muted-foreground));
  max-width: 640px;
  margin-left: auto;
  margin-right: auto;
`;

export const OccasionPage: React.FC<OccasionPageProps> = ({
  title,
  sections,
  onSignInClick,
  onProductClick,
  onCtaClick,
  authOverride,
  authInstance: authInstanceProp,
  headerActions,
  midCarouselSlot,
  occasion,
}) => {
  /* Occasion pages have no hero CTA — observe the page H1 as the sentinel.
     Once the title is scrolled off the top, the sticky CTA appears so the
     primary action ("Find a gift") is reachable while browsing carousels. */
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const ctxAuth = useAuth();
  const authInstance = authInstanceProp ?? ctxAuth;
  const { ready, signedIn } = useIsSignedIn(authOverride, authInstance);
  return (
    <Page>
      <SiteHeader onSignInClick={onSignInClick} actions={headerActions} />
      <Inner>
        <PageTitle ref={titleRef}>{title}</PageTitle>
        <Sections>
          {sections.map((section, idx) => (
            <React.Fragment key={section.slug}>
              <CarouselSection
                title={section.title}
                shortTitle={section.shortTitle}
                products={section.products}
                isFirstCarousel={idx === 0}
                carouselIndex={idx}
                totalCarousels={sections.length}
                occasion={occasion}
                onProductClick={(p, i) => onProductClick?.(p, section.slug, i)}
              />
              {idx === 1 && midCarouselSlot}
            </React.Fragment>
          ))}
        </Sections>
        <Disclaimer>
          Every gift is hand-picked by our (slightly obsessive) team. Some links may earn us a small
          commission at no cost to you.
        </Disclaimer>
      </Inner>
      <Footer />
      <StickyPrimaryCtaMobileSpacer />
      <StickyPrimaryCta
        triggerRef={titleRef}
        onCtaClick={onCtaClick}
        signInSlot={
          // Hide the secondary "Sign in" CTA once the user is authenticated
          // (sheet bug #59). Wait for `ready` so we don't flash a Sign-in
          // button during the bootstrap and yank it once auth lands.
          ready && !signedIn && onSignInClick ? (
            <Button label="Sign in" variant="ghost" onClick={onSignInClick} />
          ) : null
        }
      />
    </Page>
  );
};
