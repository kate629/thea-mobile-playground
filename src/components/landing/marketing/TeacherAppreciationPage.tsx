import React, { useCallback, useRef } from 'react';
import styled from 'styled-components';
import { type Auth } from 'firebase/auth';
import { useAuth } from '../../../theaWeb/firebase/FirebaseContext';
import { SiteHeader } from '../SiteHeader';
import { Footer } from './Footer';
import { CarouselProduct } from './CarouselSection';
import { OccasionProductCard } from '../../ui/OccasionProductCard';
import { StickyPrimaryCta, StickyPrimaryCtaMobileSpacer } from './StickyPrimaryCta';
import { Button } from '../../ui/Button';
import {
  useIsSignedIn,
  type AuthOverride,
} from '../../../theaWeb/hooks/useIsSignedIn';
import { gaProductClick } from '../../../theaWeb/lib/gaPixel';
import { metaViewContent } from '../../../theaWeb/lib/metaPixel';

export interface TeacherAppreciationPageProps {
  /** Page H1. */
  title: string;
  products: CarouselProduct[];
  onSignInClick?: () => void;
  onProductClick?: (product: CarouselProduct, index: number) => void;
  /** Sticky "Find a gift" CTA action. */
  onCtaClick?: () => void;
  /** URL slug, threaded into product_click + ViewContent analytics. */
  occasion?: string;
  /** Test/story override: force signed-in/out branch without touching auth. */
  authOverride?: AuthOverride;
  authInstance?: Auth;
  /** Story override (signed-in surfaces) for the SiteHeader actions slot. */
  headerActions?: React.ReactNode;
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

/* Card width mirrors the carousel <Slide> on other occasion pages
   (~30% column at >=768px). On mobile 2-up, on tablet 3-up, on desktop 4-up
   — same breakpoints used by the homepage OccasionGrid so users see a
   consistent rhythm clicking from a tile into a guide. */
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px 16px;
  @media (min-width: 640px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 32px;
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const Disclaimer = styled.p`
  margin: 56px auto 24px;
  text-align: center;
  font-size: 13px;
  color: hsl(var(--muted-foreground));
  max-width: 640px;
`;

export const TeacherAppreciationPage: React.FC<TeacherAppreciationPageProps> = ({
  title,
  products,
  onSignInClick,
  onProductClick,
  onCtaClick,
  occasion,
  authOverride,
  authInstance: authInstanceProp,
  headerActions,
}) => {
  /* Mirror OccasionPage: sticky CTA appears once the H1 scrolls offscreen. */
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const ctxAuth = useAuth();
  const authInstance = authInstanceProp ?? ctxAuth;
  const { ready, signedIn } = useIsSignedIn(authOverride, authInstance);

  /* Vertical-grid analog of CarouselSection's per-click handler — fires
     gaProductClick + Meta ViewContent so this page contributes the same
     analytics shape as the carousel guides. carousel_name is the page H1
     (no per-section grouping on this layout). */
  const handleProductClick = useCallback(
    (p: CarouselProduct, i: number) => {
      if (occasion !== undefined) {
        gaProductClick({
          product_id: p.id,
          product_name: p.title,
          ...(p.brand !== undefined ? { brand: p.brand } : {}),
          ...(p.price !== undefined ? { price: p.price } : {}),
          destination_url: p.productUrl ?? '',
          occasion,
          carousel_name: title,
          card_position: i,
        });
        metaViewContent({
          content_name: p.title,
          content_ids: [p.id],
          content_category: title,
          ...(p.price !== undefined ? { value: p.price } : {}),
          currency: 'USD',
        });
      }
      onProductClick?.(p, i);
    },
    [occasion, title, onProductClick],
  );

  return (
    <Page>
      <SiteHeader onSignInClick={onSignInClick} actions={headerActions} />
      <Inner>
        <PageTitle ref={titleRef}>{title}</PageTitle>
        <Grid>
          {products.map((p, i) => (
            <OccasionProductCard
              key={p.id}
              imageUrl={p.imageUrl}
              imageUrlCdn={p.imageUrlCdn}
              imageUrlCdnMobile={p.imageUrlCdnMobile}
              title={p.title}
              brand={p.brand}
              price={p.price}
              productUrl={p.productUrl}
              onClick={() => handleProductClick(p, i)}
              priority={i === 0}
            />
          ))}
        </Grid>
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
          ready && !signedIn && onSignInClick ? (
            <Button label="Sign in" variant="ghost" onClick={onSignInClick} />
          ) : null
        }
      />
    </Page>
  );
};
