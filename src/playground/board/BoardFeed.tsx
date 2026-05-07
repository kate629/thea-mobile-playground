import React from 'react';
import styled from 'styled-components';
import { ResultsProductCard } from '../../components/landing/results/ResultsProductCard';
import type { ResultsProductCardItem } from '../../components/landing/results/types';

const Feed = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 12px 4px 32px;
`;

// Hide the X dismiss button, "..." overflow menu, AND the original heart-only
// save button on each card — the BoardFeed-owned wide Save bar at the bottom
// of the image replaces the heart. Shared ResultsProductCard stays untouched
// for clean port-back. The wide SaveBar carries a `data-board-save` flag so
// the `aria-label='Save'` rule below doesn't hide IT too.
const CardWrap = styled.div<{ $departing?: boolean }>`
  position: relative;
  transition: opacity 700ms cubic-bezier(0.22, 1, 0.36, 1);
  opacity: ${({ $departing }) => ($departing ? 0 : 1)};

  & button[aria-label='Remove item'],
  & button[aria-label='More actions'],
  & button[aria-label='Save']:not([data-board-save]) {
    display: none !important;
  }
`;

// Aspect-ratio wrap mirrors the image area's 4:5 ratio so we can position the
// Save bar at the bottom of the image without measuring the meta area below.
const ImageOverlayWrap = styled.div`
  position: absolute;
  inset: 0 0 auto 0;
  aspect-ratio: 4 / 5;
  pointer-events: none;
`;

const SaveBar = styled.button<{ $saved: boolean }>`
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  height: 11%;
  min-height: 40px;
  border-radius: 9999px;
  border: 1px solid hsl(var(--border) / 0.7);
  background: ${({ $saved }) =>
    $saved ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.9)'};
  backdrop-filter: blur(6px);
  box-shadow: ${({ theme }) => theme.shadow.card};
  pointer-events: auto;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--foreground));
  transition: transform 150ms ease, background 150ms ease;
  &:active { transform: scale(0.98); }
`;

const HeartGlyph: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill={filled ? 'hsl(var(--liked))' : 'none'}
    stroke="hsl(var(--liked))"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

interface BoardFeedProps {
  products: ResultsProductCardItem[];
  isLiked: (id: string) => boolean;
  departingIds?: Set<string>;
  onSaveClick: (item: ResultsProductCardItem, sourceEl: HTMLElement | null) => void;
  onProductClick: (item: ResultsProductCardItem) => void;
  onMarkPurchased?: (item: ResultsProductCardItem) => void;
}

export const BoardFeed: React.FC<BoardFeedProps> = ({
  products,
  isLiked,
  departingIds,
  onSaveClick,
  onProductClick,
  onMarkPurchased,
}) => (
  <Feed>
    {products.map((p, i) => {
      const departing = departingIds?.has(p.id) ?? false;
      const saved = isLiked(p.id);
      return (
        <CardWrap key={p.id} data-product-id={p.id} $departing={departing}>
          <ResultsProductCard
            item={p}
            liked={saved}
            priority={i < 1}
            onClick={() => onProductClick(p)}
            // The original card's onSaveClick is wired through but the heart
            // button is hidden via CSS — clicking the wide Save bar below is
            // the only way to fire save in the playground.
            onSaveClick={() => undefined}
            onMarkPurchased={onMarkPurchased ? () => onMarkPurchased(p) : undefined}
          />
          <ImageOverlayWrap>
            <SaveBar
              type="button"
              aria-label={saved ? 'Saved' : 'Save'}
              data-board-save
              $saved={saved}
              disabled={departing || saved}
              onClick={(e) => {
                e.stopPropagation();
                if (departing || saved) return;
                const el = document.querySelector<HTMLElement>(
                  `[data-product-id="${p.id}"] img`,
                );
                onSaveClick(p, el);
              }}
            >
              <HeartGlyph filled={saved} />
              {saved ? 'Saved' : 'Save'}
            </SaveBar>
          </ImageOverlayWrap>
        </CardWrap>
      );
    })}
  </Feed>
);
