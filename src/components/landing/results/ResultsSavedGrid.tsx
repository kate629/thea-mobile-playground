import React from 'react';
import styled from 'styled-components';
import { HeartButton } from '../../ui/HeartButton';
import { ResultsProductCardItem } from './types';

export interface ResultsSavedGridProps {
  items: ResultsProductCardItem[];
  /** Slot for the future ExternalItemAdder. */
  topSlot?: React.ReactNode;
  /** Personalize the empty-state copy ("Bought a gift for {name}?"). */
  personName?: string;
  onUnsave?: (item: ResultsProductCardItem) => void;
  onItemClick?: (item: ResultsProductCardItem) => void;
}

const Wrap = styled.div`
  padding-bottom: 64px;
`;

const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 80px 24px;
`;

const EmptyHint = styled.p`
  margin: 16px 0 0 0;
  font-size: 15px;
  color: hsl(var(--muted-foreground));
  max-width: 340px;
`;

const Count = styled.p`
  margin: 0 0 12px 0;
  font-size: 14px;
  color: hsl(var(--muted-foreground));
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  @media (min-width: 640px) { grid-template-columns: repeat(3, 1fr); }
  @media (min-width: 1024px) { grid-template-columns: repeat(4, 1fr); }
`;

const Card = styled.div`
  position: relative;
  cursor: pointer;
`;

const ImageFrame = styled.div`
  aspect-ratio: 4 / 5;
  border-radius: 16px;
  overflow: hidden;
  background: hsl(var(--muted));
  position: relative;
`;

const Img = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const Meta = styled.div`
  margin-top: 8px;
  padding: 0 4px;
`;

const Title = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: hsl(var(--foreground));
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Brand = styled.p`
  margin: 2px 0 0 0;
  font-size: 14px;
  color: hsl(var(--muted-foreground));
`;

const Price = styled.p`
  margin: 2px 0 0 0;
  font-size: 14px;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
`;

const HeartGlyphLarge: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'hsl(var(--muted-foreground))' }}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export const ResultsSavedGrid: React.FC<ResultsSavedGridProps> = ({
  items,
  topSlot,
  onUnsave,
  onItemClick,
}) => (
  <Wrap>
    {topSlot}
    {items.length === 0 ? (
      <Empty>
        <HeartGlyphLarge />
        <EmptyHint>Tap the heart on any gift to save it here.</EmptyHint>
      </Empty>
    ) : (
      <>
        <Count>
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </Count>
        <Grid>
          {items.map((item) => (
            <Card key={item.id} onClick={() => onItemClick?.(item)}>
              <ImageFrame>
                <Img src={item.imageUrl} alt={item.title} loading="lazy" />
                <HeartButton
                  liked
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnsave?.(item);
                  }}
                />
              </ImageFrame>
              <Meta>
                <Title>{item.title}</Title>
                {item.brand && <Brand>{item.brand}</Brand>}
                {item.price != null && <Price>${Math.round(item.price)}</Price>}
              </Meta>
            </Card>
          ))}
        </Grid>
      </>
    )}
  </Wrap>
);
