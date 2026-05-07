import React, { forwardRef, useEffect, useRef, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import type { ResultsProductCardItem } from '../../components/landing/results/types';
import type { RecipientAccent } from './recipientAccent';

// Thumbnail size — kept in sync with THUMB_SIZE_PX in useFlightAnimation so
// the flying clone lands at the right scale.
const THUMB_SIZE = 132;

const Panel = styled.div`
  background: transparent;
  padding: 14px 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
  min-height: 0;
`;

const Header = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: center;
`;

// Matches the Mom-anchor style in BoardHeader: sans-serif, weight 600,
// 22px, NOT italic. Centered in the saved tray. Reads as a real section
// heading — same typographic register as the recipient name above.
const Label = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 22px;
  font-weight: 600;
  color: hsl(var(--foreground));
  letter-spacing: -0.01em;
  line-height: 1.1;
`;

// ─── Row layout (default snap) ────────────────────────────────────────
const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }
  padding: 4px 2px 8px;
`;

// ─── Grid layout (expanded snap) ──────────────────────────────────────
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 12px;
  padding: 4px 2px 80px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
`;

const GridCard = styled.button<{ $accentSoft: string }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: transparent;
  border: none;
  padding: 0;
  text-align: left;
  cursor: pointer;
  transition: transform 150ms ease;
  &:active { transform: scale(0.98); }
`;

const GridImage = styled.div<{ $accentSoft: string }>`
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: 14px;
  overflow: hidden;
  background: hsl(var(--muted));
  border: 1px solid hsl(var(--border));
  box-shadow: 0 4px 12px ${({ $accentSoft }) =>
    $accentSoft.replace('hsl(', 'hsla(').replace(')', ', 0.25)')};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const GridMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 4px;
`;

const GridTitle = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--foreground));
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const GridBrand = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 13px;
  color: hsl(var(--muted-foreground));
`;

const GridPrice = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 13px;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
`;

// ─── Thumbnail (row layout) ───────────────────────────────────────────
// Save-landing animation: just a gentle scale wobble. The earlier halo
// pulse read as a "pink flash" and was visually loud — pulled it.
const wobble = keyframes`
  0%   { transform: scale(1); }
  35%  { transform: scale(1.06); }
  70%  { transform: scale(0.98); }
  100% { transform: scale(1); }
`;

const Thumb = styled.button<{ $accentSoft: string; $fresh: boolean }>`
  flex: 0 0 auto;
  width: ${THUMB_SIZE}px;
  height: ${THUMB_SIZE}px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--muted));
  padding: 0;
  cursor: pointer;
  transition: transform 150ms ease;
  box-shadow: 0 6px 16px ${({ $accentSoft }) =>
    $accentSoft.replace('hsl(', 'hsla(').replace(')', ', 0.30)')};

  ${({ $fresh }) =>
    $fresh &&
    css`
      animation: ${wobble} 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
    `}

  &:active { transform: scale(0.96); }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const EmptySlot = styled.div<{ $accentSoft: string }>`
  flex: 0 0 auto;
  width: ${THUMB_SIZE}px;
  height: ${THUMB_SIZE}px;
  border-radius: 16px;
  border: 1.5px dashed ${({ $accentSoft }) => $accentSoft};
  background: transparent;
`;

const EmptyHint = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  line-height: 1.4;
  color: hsl(var(--muted-foreground));
  flex: 1;
  min-width: 0;
`;

interface BoardSavedPanelProps {
  recipientName: string;
  items: ResultsProductCardItem[];
  accent: RecipientAccent;
  /** Layout mode: 'row' for default snap (horizontal carousel of thumbs)
   *  or 'grid' for expanded snap (2-col grid with title/brand/price). */
  layout?: 'row' | 'grid';
  onItemClick?: (item: ResultsProductCardItem) => void;
}

export const BoardSavedPanel = forwardRef<HTMLDivElement, BoardSavedPanelProps>(
  ({ recipientName, items, accent, layout = 'row', onItemClick }, ref) => {
    const [freshId, setFreshId] = useState<string | null>(null);
    const prevFirstIdRef = useRef<string | null>(null);
    const prevCountRef = useRef<number>(items.length);

    useEffect(() => {
      const newFirstId = items[0]?.id ?? null;
      if (
        newFirstId &&
        newFirstId !== prevFirstIdRef.current &&
        items.length > prevCountRef.current
      ) {
        setFreshId(newFirstId);
        const t = window.setTimeout(() => setFreshId(null), 720);
        prevFirstIdRef.current = newFirstId;
        prevCountRef.current = items.length;
        return () => window.clearTimeout(t);
      }
      prevFirstIdRef.current = newFirstId;
      prevCountRef.current = items.length;
    }, [items]);

    return (
      <Panel ref={ref} data-saved-panel>
        <Header>
          <Label>Saved for {recipientName}</Label>
        </Header>
        {layout === 'grid' ? (
          items.length === 0 ? (
            <Row>
              <EmptySlot $accentSoft={accent.soft} />
              <EmptyHint>Save items below to start {recipientName}'s board</EmptyHint>
            </Row>
          ) : (
            <Grid>
              {items.map((item) => (
                <GridCard
                  key={item.id}
                  type="button"
                  aria-label={`Open ${item.title}`}
                  onClick={() => onItemClick?.(item)}
                  $accentSoft={accent.soft}
                  data-saved-thumb-id={item.id}
                >
                  <GridImage $accentSoft={accent.soft}>
                    <img src={item.imageUrl} alt={item.title} loading="lazy" />
                  </GridImage>
                  <GridMeta>
                    <GridTitle>{item.title}</GridTitle>
                    {item.brand && <GridBrand>{item.brand}</GridBrand>}
                    {item.price != null && <GridPrice>${Math.round(item.price)}</GridPrice>}
                  </GridMeta>
                </GridCard>
              ))}
            </Grid>
          )
        ) : (
          <Row>
            {items.length === 0 ? (
              <>
                <EmptySlot $accentSoft={accent.soft} />
                <EmptyHint>Save items below to start {recipientName}'s board</EmptyHint>
              </>
            ) : (
              items.map((item) => (
                <Thumb
                  key={item.id}
                  type="button"
                  aria-label={`Open ${item.title}`}
                  onClick={() => onItemClick?.(item)}
                  data-saved-thumb-id={item.id}
                  $accentSoft={accent.soft}
                  $fresh={freshId === item.id}
                >
                  <img src={item.imageUrl} alt={item.title} loading="lazy" />
                </Thumb>
              ))
            )}
          </Row>
        )}
      </Panel>
    );
  },
);
BoardSavedPanel.displayName = 'BoardSavedPanel';
