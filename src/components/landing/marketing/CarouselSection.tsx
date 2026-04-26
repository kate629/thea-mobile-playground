import React from 'react';
import styled from 'styled-components';
import { OccasionProductCard, OccasionProductCardProps } from '../../ui/OccasionProductCard';

export interface CarouselProduct
  extends Pick<OccasionProductCardProps, 'imageUrl' | 'title' | 'brand' | 'price' | 'productUrl'> {
  /** Stable id used for liked-set lookup + React key. */
  id: string;
}

export interface CarouselSectionProps {
  title: string;
  /** Optional shorter title for narrow viewports. */
  shortTitle?: string;
  products: CarouselProduct[];
  /** Set of product ids currently saved/liked. */
  savedProductIds?: ReadonlySet<string>;
  /** Whether to mark the first card eager-loaded (LCP boost on the first carousel of a page). */
  isFirstCarousel?: boolean;
  onProductClick?: (product: CarouselProduct, index: number) => void;
  onSaveClick?: (product: CarouselProduct) => void;
  /** Visibility hints for the optional chevron arrows. View shows the arrow only when the corresponding flag is true. */
  canScrollLeft?: boolean;
  canScrollRight?: boolean;
  onScrollLeft?: () => void;
  onScrollRight?: () => void;
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

export const CarouselSection: React.FC<CarouselSectionProps> = ({
  title,
  shortTitle,
  products,
  savedProductIds,
  isFirstCarousel = false,
  onProductClick,
  onSaveClick,
  canScrollLeft = false,
  canScrollRight = false,
  onScrollLeft,
  onScrollRight,
}) => (
  <Section>
    <TitleRow>
      <Title>
        <TitleShort>{shortTitle ?? title}</TitleShort>
        <TitleLong>{title}</TitleLong>
      </Title>
      <Divider />
    </TitleRow>
    <ScrollArea>
      <Scroller>
        {products.map((p, i) => (
          <Slide key={p.id}>
            <OccasionProductCard
              imageUrl={p.imageUrl}
              title={p.title}
              brand={p.brand}
              price={p.price}
              productUrl={p.productUrl}
              liked={savedProductIds?.has(p.id) ?? false}
              onClick={() => onProductClick?.(p, i)}
              onSaveClick={() => onSaveClick?.(p)}
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
