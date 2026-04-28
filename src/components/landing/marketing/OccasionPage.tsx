import React, { useRef } from 'react';
import styled from 'styled-components';
import { SiteHeader } from '../SiteHeader';
import { Footer } from './Footer';
import { CarouselSection, CarouselProduct } from './CarouselSection';
import { StickyPrimaryCta, StickyPrimaryCtaMobileSpacer } from './StickyPrimaryCta';
import { Button } from '../../ui/Button';

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
  savedProductIds?: ReadonlySet<string>;
  onSignInClick?: () => void;
  onProductClick?: (product: CarouselProduct, sectionSlug: string, indexInSection: number) => void;
  onSaveClick?: (product: CarouselProduct) => void;
  /** Click handler for the sticky "Find a gift" CTA. Same action a homepage
   *  hero CTA fires (route to /quiz). Optional so stories can omit it. */
  onCtaClick?: () => void;
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
  savedProductIds,
  onSignInClick,
  onProductClick,
  onSaveClick,
  onCtaClick,
}) => {
  /* Occasion pages have no hero CTA — observe the page H1 as the sentinel.
     Once the title is scrolled off the top, the sticky CTA appears so the
     primary action ("Find a gift") is reachable while browsing carousels. */
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  return (
    <Page>
      <SiteHeader onSignInClick={onSignInClick} />
      <Inner>
        <PageTitle ref={titleRef}>{title}</PageTitle>
        <Sections>
          {sections.map((section, idx) => (
            <CarouselSection
              key={section.slug}
              title={section.title}
              shortTitle={section.shortTitle}
              products={section.products}
              savedProductIds={savedProductIds}
              isFirstCarousel={idx === 0}
              onProductClick={(p, i) => onProductClick?.(p, section.slug, i)}
              onSaveClick={onSaveClick}
            />
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
          onSignInClick ? (
            <Button label="Sign in" variant="ghost" onClick={onSignInClick} />
          ) : null
        }
      />
    </Page>
  );
};
