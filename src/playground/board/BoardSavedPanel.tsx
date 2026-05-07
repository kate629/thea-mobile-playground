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
  gap: 12px;
`;

// Larger header treatment — italic serif (matches the "thea" wordmark) so the
// saved tray reads as a real section header, not a label.
const Label = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.font.serif ?? 'Georgia, serif'};
  font-style: italic;
  font-size: 24px;
  font-weight: 500;
  color: hsl(var(--foreground));
  letter-spacing: 0;
  line-height: 1.1;
`;

// Counter slides in/out on increment so the number doesn't just snap.
const counterPulse = keyframes`
  0% { transform: translateY(-3px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

const Count = styled.span<{ $animKey: number }>`
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  color: hsl(var(--muted-foreground));
  display: inline-block;
  /* Re-key on increment so the keyframes restart. */
  animation: ${counterPulse} 240ms ease-out;
  animation-fill-mode: backwards;
  &:last-child { /* no-op selector to keep $animKey usage */ }
`;

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

// Save-landing animation: a brief halo pulse + a gentle scale wobble on the
// just-arrived thumbnail. Subtle — the warmth is in the timing, not in big
// motion. Halo color comes from the recipient's accent so each board has
// its own quiet signature when items land.
const wobble = keyframes`
  0%   { transform: scale(1); }
  35%  { transform: scale(1.06); }
  70%  { transform: scale(0.98); }
  100% { transform: scale(1); }
`;

const haloPulse = keyframes`
  0%   { box-shadow: 0 0 0 0    var(--accent-glow), 0 6px 16px var(--accent-shadow); }
  100% { box-shadow: 0 0 0 16px transparent,        0 6px 16px var(--accent-shadow); }
`;

const Thumb = styled.button<{ $accentSoft: string; $accentGlow: string; $fresh: boolean }>`
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
  /* Polaroid drop shadow — warm clay tint by default, recipient-accented
     for variation per board. CSS variables exposed so the halo animation
     can reference the same accent without re-deriving. */
  --accent-shadow: ${({ $accentSoft }) =>
    $accentSoft.replace('hsl(', 'hsla(').replace(')', ', 0.30)')};
  --accent-glow: ${({ $accentGlow }) =>
    $accentGlow.replace('hsl(', 'hsla(').replace(')', ', 0.55)')};
  box-shadow: 0 6px 16px var(--accent-shadow);

  ${({ $fresh }) =>
    $fresh &&
    css`
      animation:
        ${wobble} 320ms cubic-bezier(0.34, 1.56, 0.64, 1),
        ${haloPulse} 700ms ease-out;
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
  /** Items in newest-first order. */
  items: ResultsProductCardItem[];
  accent: RecipientAccent;
  onItemClick?: (item: ResultsProductCardItem) => void;
}

export const BoardSavedPanel = forwardRef<HTMLDivElement, BoardSavedPanelProps>(
  ({ recipientName, items, accent, onItemClick }, ref) => {
    // Track the most recently-added item so we can run the save-landing
    // animation on it (and only on it) when the items array grows.
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
          {items.length > 0 && (
            <Count key={items.length} $animKey={items.length}>
              {items.length}
            </Count>
          )}
        </Header>
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
                $accentGlow={accent.glow}
                $fresh={freshId === item.id}
              >
                <img src={item.imageUrl} alt={item.title} loading="lazy" />
              </Thumb>
            ))
          )}
        </Row>
      </Panel>
    );
  },
);
BoardSavedPanel.displayName = 'BoardSavedPanel';
