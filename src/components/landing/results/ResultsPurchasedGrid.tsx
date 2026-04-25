import React from 'react';
import styled from 'styled-components';
import { ResultsProductCardItem } from './types';

export interface ResultsPurchasedGridProps {
  items: ResultsProductCardItem[];
  /** Personalizes the empty-state copy. */
  personName?: string;
  onUndo?: (item: ResultsProductCardItem) => void;
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
  cursor: pointer;
`;

const ImageFrame = styled.div`
  aspect-ratio: 4 / 5;
  border-radius: 16px;
  overflow: hidden;
  background: #ffffff;
  position: relative;
`;

const Img = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0.92;
`;

const PurchasedBadge = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  height: 28px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  background: hsl(var(--foreground));
  color: #ffffff;
`;

const UndoButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  box-shadow: ${({ theme }) => theme.shadow.card};
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 150ms ease;
  &:hover { background: #fff; }
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

const CheckIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CheckGlyphLarge: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'hsl(var(--muted-foreground))' }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const UndoIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'hsl(var(--foreground))' }}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H10" />
  </svg>
);

export const ResultsPurchasedGrid: React.FC<ResultsPurchasedGridProps> = ({
  items,
  personName = 'them',
  onUndo,
  onItemClick,
}) => (
  <Wrap>
    {items.length === 0 ? (
      <Empty>
        <CheckGlyphLarge />
        <EmptyHint>
          Bought a gift for {personName}? Mark it from your Saved items so you remember next time.
        </EmptyHint>
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
                <PurchasedBadge>
                  <CheckIcon />
                  Purchased
                </PurchasedBadge>
                <UndoButton
                  type="button"
                  aria-label="Move back to saved"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUndo?.(item);
                  }}
                >
                  <UndoIcon />
                </UndoButton>
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
