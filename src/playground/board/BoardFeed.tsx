import React from 'react';
import styled from 'styled-components';
import { ResultsProductCard } from '../../components/landing/results/ResultsProductCard';
import type { ResultsProductCardItem } from '../../components/landing/results/types';

const Feed = styled.div`
  /* Mobile: single column, the canonical mobile-first layout.
     Tablet (≥640px): 2 columns — single wide cards feel cavernous once
       the viewport gets that wide.
     Desktop (≥1024px): 4 columns — the discover surface should feel
       like a dense feed on a laptop, not a stretched mobile column. */
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }
  @media (min-width: 1024px) {
    /* 3 columns at desktop — the right sidebar takes the visual room
       a 4th column would otherwise occupy. */
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
  }
  /* Bottom padding clears the saved-tray bottom sheet at its collapsed
     snap point so the last cards are scrollable into view. At default
     snap the sheet covers more, but the user can drag it down to reach
     these items. On desktop the sheet is replaced by a right sidebar,
     so the big bottom padding becomes wasted whitespace — drop it. */
  padding: 12px 4px 240px;
  @media (min-width: 1024px) {
    padding: 12px 8px 48px;
  }
`;

// Hide the X dismiss button, "..." overflow menu, AND the original heart-only
// save button on each card — the BoardFeed-owned wide Save bar at the bottom
// of the image replaces the heart. Shared ResultsProductCard stays untouched
// for clean port-back. The wide SaveBar carries a `data-board-save` flag so
// the `aria-label='Save'` rule below doesn't hide IT too.
//
// Also overrides the ImageFrame's aspect-ratio from 4/5 to 1/1 (square) —
// 20% shorter cards so the Save bar sits comfortably above the bottom-sheet
// at default snap. Targets the structural path:
//   CardWrap > Root > Inner > ImageFrame (first child)
const CardWrap = styled.div<{ $departing?: boolean }>`
  position: relative;
  transition: opacity 700ms cubic-bezier(0.22, 1, 0.36, 1);
  opacity: ${({ $departing }) => ($departing ? 0 : 1)};

  & button[aria-label='Remove item'],
  & button[aria-label='More actions'],
  & button[aria-label='Save']:not([data-board-save]) {
    display: none !important;
  }

  /* Make the image area square instead of 4:5 — 20% shorter overall.
     On desktop the cards get even shorter (6:5) so the second row of
     the 3-column grid peeks above the fold on typical laptop heights —
     gives the user a "scroll for more" affordance without a fade. */
  & > div:first-child > div > div:first-child {
    aspect-ratio: 1 / 1 !important;
  }
  @media (min-width: 1024px) {
    & > div:first-child > div > div:first-child {
      aspect-ratio: 6 / 5 !important;
    }
  }
`;

// Aspect-ratio wrap mirrors the image area so we can position the Save
// bar at the bottom of the image without measuring the meta area below.
// Mobile = 1:1 (square); desktop drops to 6:5 to match the override on
// CardWrap above so the 2nd row peeks.
const ImageOverlayWrap = styled.div`
  position: absolute;
  inset: 0 0 auto 0;
  aspect-ratio: 1 / 1;
  pointer-events: none;
  @media (min-width: 1024px) {
    aspect-ratio: 6 / 5;
  }
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

// End-of-feed cross-promotion. Spans the full row on desktop so it
// reads as a section break rather than another product. Outlined +
// muted so it doesn't visually compete with real products, but the
// emoji + label gives it enough character to be tappable.
const NextTabCard = styled.button`
  grid-column: 1 / -1;
  appearance: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 22px 18px;
  border-radius: 16px;
  background: ${({ theme }) => theme.color.creamLight};
  border: 1.5px dashed hsl(var(--border));
  cursor: pointer;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 15px;
  font-weight: 500;
  color: hsl(var(--foreground));
  transition: background 150ms ease, border-color 150ms ease, transform 150ms ease;
  &:hover {
    background: ${({ theme }) => theme.color.cream};
    border-color: hsl(var(--foreground) / 0.4);
  }
  &:active { transform: scale(0.99); }
`;

const NextTabEmoji = styled.span`
  font-size: 18px;
  line-height: 1;
`;

const NextTabArrow = styled.span`
  font-size: 16px;
  margin-left: 4px;
  color: hsl(var(--muted-foreground));
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
  /** Cross-promotion to a sibling chip tab. Rendered as the last card
   *  in the feed (full-row span on the desktop grid) — catches the
   *  user at the moment they've finished the current category and
   *  signals there's more elsewhere. */
  nextTab?: { key: string; label: string; emoji?: string };
  onSelectNextTab?: () => void;
}

export const BoardFeed: React.FC<BoardFeedProps> = ({
  products,
  isLiked,
  departingIds,
  onSaveClick,
  onProductClick,
  onMarkPurchased,
  nextTab,
  onSelectNextTab,
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
              aria-label={saved ? 'Liked' : 'Like'}
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
              {saved ? 'Liked' : 'Like'}
            </SaveBar>
          </ImageOverlayWrap>
        </CardWrap>
      );
    })}
    {nextTab && products.length > 0 && (
      <NextTabCard
        type="button"
        aria-label={`Switch to ${nextTab.label}`}
        onClick={onSelectNextTab}
      >
        {nextTab.emoji && <NextTabEmoji aria-hidden>{nextTab.emoji}</NextTabEmoji>}
        <span>More in {nextTab.label}</span>
        <NextTabArrow aria-hidden>→</NextTabArrow>
      </NextTabCard>
    )}
  </Feed>
);
