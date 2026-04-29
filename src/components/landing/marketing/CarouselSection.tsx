import React, { useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { OccasionProductCard, OccasionProductCardProps } from '../../ui/OccasionProductCard';
import { useCarouselImpression } from '../../../theaWeb/hooks/useCarouselImpression';
import {
  gaCarouselScroll,
  gaCarouselVisible,
  gaProductClick,
} from '../../../theaWeb/lib/gaPixel';
import { metaViewContent } from '../../../theaWeb/lib/metaPixel';

export interface CarouselProduct
  extends Pick<
    OccasionProductCardProps,
    'imageUrl' | 'imageUrlCdn' | 'imageUrlCdnMobile' | 'title' | 'brand' | 'price' | 'productUrl'
  > {
  /** Stable React key. */
  id: string;
}

export interface CarouselSectionProps {
  title: string;
  /** Optional shorter title for narrow viewports. */
  shortTitle?: string;
  products: CarouselProduct[];
  /** Whether to mark the first card eager-loaded (LCP boost on the first carousel of a page). */
  isFirstCarousel?: boolean;
  onProductClick?: (product: CarouselProduct, index: number) => void;
  /** Visibility hints for the optional chevron arrows. View shows the arrow only when the corresponding flag is true. */
  canScrollLeft?: boolean;
  canScrollRight?: boolean;
  onScrollLeft?: () => void;
  onScrollRight?: () => void;
  /**
   * Position of this carousel within the page (0-indexed). When provided
   * alongside `totalCarousels`, drives the `carousel_visible` /
   * `carousel_scroll` analytics events; otherwise impression tracking is
   * skipped (e.g., Storybook stories).
   */
  carouselIndex?: number;
  totalCarousels?: number;
  /** Set on guide pages — the URL slug. Drives the `occasion` GA4 param +
   *  enables guide-page `product_click` + Meta `ViewContent` analytics. */
  occasion?: string;
}

const Section = styled.section`
  width: 100%;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
`;

const Title = styled.h2`
  font-size: 16px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: hsl(var(--muted-foreground));
  margin: 0;
  white-space: normal;
  @media (min-width: 768px) { font-size: 18px; }
`;

const TitleShort = styled.span`
  display: inline;
  @media (min-width: 768px) { display: none; }
`;
const TitleLong = styled.span`
  display: none;
  @media (min-width: 768px) { display: inline; }
`;

const Divider = styled.div`
  flex: 1;
  height: 1px;
  background: hsl(var(--border));
`;

const ScrollArea = styled.div`
  position: relative;
  margin-left: -24px;
  margin-right: -24px;
`;

const Scroller = styled.div`
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 0 24px 8px 24px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const Slide = styled.div`
  min-width: 80%;
  max-width: 80%;
  flex-shrink: 0;
  @media (min-width: 768px) {
    min-width: calc(30% - 0.67rem);
    max-width: calc(30% - 0.67rem);
  }
`;

const ChevronButton = styled.button<{ $side: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  ${({ $side }) => ($side === 'left' ? 'left: 0' : 'right: 0')};
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  background: hsl(var(--background) / 0.8);
  backdrop-filter: blur(4px);
  border: none;
  box-shadow: var(--shadow-card);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 150ms ease;
  z-index: 2;
  &:hover { background: hsl(var(--background)); }
`;

const ChevronSvg = styled.svg`
  width: 18px;
  height: 18px;
  fill: none;
  stroke: hsl(var(--foreground) / 0.7);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

const SCROLL_THRESHOLDS: Array<25 | 50 | 75 | 100> = [25, 50, 75, 100];
const SCROLL_THROTTLE_MS = 200;

export const CarouselSection: React.FC<CarouselSectionProps> = ({
  title,
  shortTitle,
  products,
  isFirstCarousel = false,
  onProductClick,
  canScrollLeft = false,
  canScrollRight = false,
  onScrollLeft,
  onScrollRight,
  carouselIndex,
  totalCarousels,
  occasion,
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const trackingEnabled =
    occasion !== undefined && carouselIndex !== undefined && totalCarousels !== undefined;
  const totalCards = products.length;

  // carousel_visible — fire once when ≥50% of the section is in view. Skip
  // when tracking isn't fully wired (Storybook, results page reuse, etc).
  const fireVisible = useCallback(() => {
    if (!trackingEnabled) return;
    gaCarouselVisible({
      carousel_name: title,
      carousel_index: carouselIndex!,
      total_carousels: totalCarousels!,
      total_cards: totalCards,
      occasion,
    });
  }, [trackingEnabled, title, carouselIndex, totalCarousels, totalCards, occasion]);
  useCarouselImpression(sectionRef, fireVisible, trackingEnabled);

  // carousel_scroll — passive listener, 200ms throttle, dedupe per-threshold
  // via a ref-Set so we never re-fire 50% after the user scrolls past it,
  // back, and forward again.
  const firedThresholdsRef = useRef<Set<number>>(new Set());
  const lastScrollTickRef = useRef<number>(0);
  useEffect(() => {
    if (!trackingEnabled) return;
    const el = scrollerRef.current;
    if (!el) return;
    const handle = () => {
      const now = Date.now();
      if (now - lastScrollTickRef.current < SCROLL_THROTTLE_MS) return;
      lastScrollTickRef.current = now;
      const scrollWidth = el.scrollWidth - el.clientWidth;
      if (scrollWidth <= 0) return;
      const percent = Math.min(100, (el.scrollLeft / scrollWidth) * 100);
      for (const threshold of SCROLL_THRESHOLDS) {
        if (percent < threshold) continue;
        if (firedThresholdsRef.current.has(threshold)) continue;
        firedThresholdsRef.current.add(threshold);
        gaCarouselScroll({
          carousel_name: title,
          carousel_index: carouselIndex!,
          total_carousels: totalCarousels!,
          total_cards: totalCards,
          occasion,
          cards_visible: Math.min(totalCards, Math.max(1, Math.ceil((threshold / 100) * totalCards))),
          percent_seen: threshold,
        });
      }
    };
    el.addEventListener('scroll', handle, { passive: true });
    return () => el.removeEventListener('scroll', handle);
  }, [trackingEnabled, title, carouselIndex, totalCarousels, totalCards, occasion]);

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
    <Section ref={sectionRef}>
      <TitleRow>
        <Title>
          <TitleShort>{shortTitle ?? title}</TitleShort>
          <TitleLong>{title}</TitleLong>
        </Title>
        <Divider />
      </TitleRow>
      <ScrollArea>
        <Scroller ref={scrollerRef}>
          {products.map((p, i) => (
            <Slide key={p.id}>
              <OccasionProductCard
                imageUrl={p.imageUrl}
                imageUrlCdn={p.imageUrlCdn}
                imageUrlCdnMobile={p.imageUrlCdnMobile}
                title={p.title}
                brand={p.brand}
                price={p.price}
                productUrl={p.productUrl}
                onClick={() => handleProductClick(p, i)}
                priority={isFirstCarousel && i === 0}
              />
            </Slide>
          ))}
        </Scroller>
        {canScrollLeft && (
          <ChevronButton $side="left" onClick={onScrollLeft} aria-label="Scroll left">
            <ChevronSvg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></ChevronSvg>
          </ChevronButton>
        )}
        {canScrollRight && (
          <ChevronButton $side="right" onClick={onScrollRight} aria-label="Scroll right">
            <ChevronSvg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></ChevronSvg>
          </ChevronButton>
        )}
      </ScrollArea>
    </Section>
  );
};
