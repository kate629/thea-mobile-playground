import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { ResultsProductCard } from './ResultsProductCard';
import { ResultsProductCardItem, ResultsProductCardState } from './types';

export interface ResultsCarouselSlot {
  item: ResultsProductCardItem;
  state: ResultsProductCardState;
  liked: boolean;
}

export interface ResultsCarouselProps {
  title: string;
  /** Per-product entries. State drives the visual exit animation. */
  slots: ResultsCarouselSlot[];
  /** Eager-load the first card's image (LCP — used only on the first carousel of the page). */
  isFirstCarousel?: boolean;
  onProductClick?: (item: ResultsProductCardItem) => void;
  onSaveClick?: (item: ResultsProductCardItem) => void;
  onDismiss?: (item: ResultsProductCardItem) => void;
  onMarkPurchased?: (item: ResultsProductCardItem) => void;
}

const Section = styled.div`
  margin-bottom: 8px;
`;

const TitleRow = styled.div`
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: hsl(var(--muted-foreground));
  white-space: normal;
  @media (min-width: 768px) {
    font-size: 18px;
  }
`;

const ScrollContainer = styled.div`
  position: relative;
  margin: 0 -16px;
`;

const Scroller = styled.div`
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 0 16px 8px;
  /* Hide scrollbar without losing scroll capability. */
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

// The base Slot pins min-width/max-width to viewport-relative values inside
// @media blocks so the scroller doesn't collapse cards. styled-components
// emits the base rule first, then the @media overrides — so a plain
// `min-width: 0` here is shadowed by every matching media query, leaving
// the slot at full layout width while opacity:0 makes it look like a gap.
// `!important` sidesteps the cascade: exit/dismiss states win over the
// breakpoint rules and the layout actually reflows.
const exitingCss = css`
  opacity: 0;
  transform: translate(18px, -20px) scale(0.82) rotate(1.5deg);
  min-width: 0 !important;
  max-width: 0 !important;
  margin-right: -16px;
  pointer-events: none;
  transition:
    opacity 750ms ease,
    transform 950ms cubic-bezier(0.34, 1.15, 0.64, 1),
    min-width 750ms cubic-bezier(0.65, 0, 0.35, 1) 320ms,
    max-width 750ms cubic-bezier(0.65, 0, 0.35, 1) 320ms,
    margin-right 750ms cubic-bezier(0.65, 0, 0.35, 1) 320ms;
`;

const dismissingCss = css`
  opacity: 0;
  transform: translateX(-12px) scale(0.96);
  min-width: 0 !important;
  max-width: 0 !important;
  margin-right: -16px;
  pointer-events: none;
  transition:
    opacity 250ms ease-out,
    transform 250ms ease-out,
    min-width 200ms ease-out 50ms,
    max-width 200ms ease-out 50ms,
    margin-right 200ms ease-out 50ms;
`;

const Slot = styled.div<{ $state: ResultsProductCardState }>`
  flex-shrink: 0;
  overflow: hidden;
  will-change: transform, opacity;
  min-width: calc(42% - 0.33rem);
  max-width: calc(42% - 0.33rem);
  @media (min-width: 640px) {
    min-width: calc(30% - 0.6rem);
    max-width: calc(30% - 0.6rem);
  }
  @media (min-width: 1024px) {
    min-width: calc(22% - 0.6rem);
    max-width: calc(22% - 0.6rem);
  }
  ${({ $state }) =>
    $state === 'exiting' ? exitingCss : $state === 'dismissing' ? dismissingCss : null}
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const SkeletonCard = styled.div`
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: ${({ theme }) => theme.radius.md};
  background: linear-gradient(
    90deg,
    hsl(var(--muted) / 0.6) 0%,
    hsl(var(--muted) / 0.9) 50%,
    hsl(var(--muted) / 0.6) 100%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;
`;

const SkeletonTitleBar = styled.div`
  width: 140px;
  height: 16px;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: linear-gradient(
    90deg,
    hsl(var(--muted) / 0.6) 0%,
    hsl(var(--muted) / 0.9) 50%,
    hsl(var(--muted) / 0.6) 100%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;
`;

/** Carousel chrome with shimmering tile placeholders. Rendered while the BE
 *  carousel session is still processing and has no products to show. */
export const SkeletonResultsCarousel: React.FC<{ tileCount?: number }> = ({
  tileCount = 5,
}) => (
  <Section>
    <TitleRow>
      <SkeletonTitleBar />
    </TitleRow>
    <ScrollContainer>
      <Scroller>
        {Array.from({ length: tileCount }, (_, i) => (
          <Slot key={`skel-${i}`} $state="idle">
            <SkeletonCard />
          </Slot>
        ))}
      </Scroller>
    </ScrollContainer>
  </Section>
);

export const ResultsCarousel: React.FC<ResultsCarouselProps> = ({
  title,
  slots,
  isFirstCarousel = false,
  onProductClick,
  onSaveClick,
  onDismiss,
  onMarkPurchased,
}) => {
  if (slots.length === 0) return null;
  return (
    <Section>
      <TitleRow>
        <Title>{title}</Title>
      </TitleRow>
      <ScrollContainer>
        <Scroller>
          {slots.map((slot, index) => (
            <Slot key={slot.item.id} $state={slot.state}>
              <ResultsProductCard
                item={slot.item}
                liked={slot.liked}
                priority={isFirstCarousel && index === 0}
                onClick={() => onProductClick?.(slot.item)}
                onSaveClick={() => onSaveClick?.(slot.item)}
                onDismiss={() => onDismiss?.(slot.item)}
                onMarkPurchased={() => onMarkPurchased?.(slot.item)}
              />
            </Slot>
          ))}
        </Scroller>
      </ScrollContainer>
    </Section>
  );
};
