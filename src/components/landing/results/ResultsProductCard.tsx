import React from 'react';
import styled from 'styled-components';
import { HeartButton } from '../../ui/HeartButton';
import { DropdownMenu } from '../../ui/DropdownMenu';
import { ResultsProductCardItem } from './types';

export interface ResultsProductCardProps {
  item: ResultsProductCardItem;
  liked: boolean;
  /** Eager-load the image for the LCP card. */
  priority?: boolean;
  onClick?: () => void;
  onSaveClick?: () => void;
  onDismiss?: () => void;
  onMarkPurchased?: () => void;
  /** Notified when the overflow menu opens/closes. */
  onOverflowOpenChange?: (open: boolean) => void;
}

const Root = styled.div`
  position: relative;
  width: 100%;
`;

const Inner = styled.div`
  cursor: pointer;
  transition: transform 150ms ease;
  &:active { transform: scale(0.98); }
`;

/**
 * Note: rounded corners + overflow:hidden moved off ImageFrame onto Img so the
 * overflow menu (anchored on the bottom-right of the image area) can paint
 * outside the visible image without being clipped (bug #21). The image itself
 * still clips to the rounded shape via its own border-radius.
 */
const ImageFrame = styled.div`
  aspect-ratio: 4 / 5;
  background: transparent;
  position: relative;
`;

const Img = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 16px;
  background: hsl(var(--muted));
`;

/**
 * 44x44 invisible hit target so the dismiss tap area meets the iOS HIG minimum.
 * Top/left are 4px so that the centered 36x36 pill lands at top:8/left:8 — visually
 * matching the HeartButton on the opposite corner (bug #20).
 */
const DismissHit = styled.button`
  position: absolute;
  top: 4px;
  left: 4px;
  z-index: 10;
  width: 44px;
  height: 44px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const DismissPill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  box-shadow: ${({ theme }) => theme.shadow.card};
  border: 1px solid hsl(var(--border) / 0.7);
`;

/**
 * Anchor the dropdown's positioning context to the full card width so the
 * menu's `right: 0` lands on the card edge instead of on the trigger button's
 * right edge — keeping "Mark as purchased" inside the card, never leaking
 * into the neighbor (bug #21).
 *
 * Mechanics, no shared-primitive changes:
 *   - OverflowWrap spans full card width (left/right inset 10px).
 *   - Force the DropdownMenu's <Wrap> (its only direct child here) to render
 *     as a full-width block with `text-align: right`, so the inline-block
 *     trigger button still floats to the right while the inner menu's
 *     `right: 0` anchors to the OverflowWrap's right edge (= card edge).
 *   - Override `[role='menu']` min/max width so the shared 180px min-width
 *     doesn't blow past the slot on mobile (~150px wide cards).
 *   - `pointer-events: none` on the wrap (with re-enabled on real children)
 *     so the empty space to the left of the trigger doesn't swallow taps
 *     on the underlying image area.
 */
const OverflowWrap = styled.div`
  position: absolute;
  bottom: 10px;
  left: 10px;
  right: 10px;
  z-index: 10;
  pointer-events: none;

  /* DropdownMenu's <Wrap> is the only child; expand it to the full card width
     and right-align the inline-block trigger inside it. */
  > div {
    display: block !important;
    text-align: right;
    pointer-events: auto;
  }

  [role='menu'] {
    min-width: 0;
    max-width: 100%;
    width: max-content;
    text-align: left;
  }
`;

const OverflowButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  box-shadow: ${({ theme }) => theme.shadow.card};
  border: 1px solid hsl(var(--border) / 0.7);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 150ms ease;
  &:hover { background: rgba(255, 255, 255, 1); }
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

const XIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'hsl(var(--muted-foreground))' }}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const MoreIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ color: 'hsl(var(--foreground))' }}>
    <circle cx="5" cy="12" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="19" cy="12" r="1.6" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const ResultsProductCard: React.FC<ResultsProductCardProps> = ({
  item,
  liked,
  priority = false,
  onClick,
  onSaveClick,
  onDismiss,
  onMarkPurchased,
  onOverflowOpenChange,
}) => (
  <Root>
    <Inner onClick={onClick}>
      <ImageFrame>
        <Img src={item.imageUrl} alt={item.title} loading={priority ? 'eager' : 'lazy'} />
        <DismissHit
          type="button"
          aria-label="Remove item"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss?.();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <DismissPill>
            <XIcon />
          </DismissPill>
        </DismissHit>
        <HeartButton
          liked={liked}
          onClick={(e) => {
            e.stopPropagation();
            onSaveClick?.();
          }}
        />
        <OverflowWrap onClick={(e) => e.stopPropagation()}>
          <DropdownMenu
            onOpenChange={onOverflowOpenChange}
            align="end"
            side="top"
            items={[
              {
                key: 'mark',
                label: 'Mark as purchased',
                leading: <CheckIcon />,
                onClick: () => onMarkPurchased?.(),
              },
            ]}
            trigger={({ onClick: triggerClick, ...rest }) => (
              <OverflowButton
                type="button"
                aria-label="More actions"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerClick();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                {...rest}
              >
                <MoreIcon />
              </OverflowButton>
            )}
          />
        </OverflowWrap>
      </ImageFrame>
      <Meta>
        <Title>{item.title}</Title>
        {item.brand && <Brand>{item.brand}</Brand>}
        {item.price != null && <Price>${Math.round(item.price)}</Price>}
      </Meta>
    </Inner>
  </Root>
);
