import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { RangeSlider } from '../../components/ui/RangeSlider';

/**
 * Compact price-range filter anchored below the pill row. Tap the $ button
 * in BoardHeader to open. Uses the upstream dual-thumb RangeSlider — same
 * one the ProfileDrawer uses — so the playground's price UX matches the
 * existing profile-edit price slider.
 *
 * v1 stores state in the parent (BoardHeader) but doesn't actually filter
 * products yet — real implementation would thread the range into the
 * carousel/agent params. Visible-only for the playground.
 */

const Panel = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 8px;
  z-index: 25;
  background: #ffffff;
  border: 1px solid ${({ theme }) => theme.color.warmBorder};
  border-radius: 18px;
  box-shadow: ${({ theme }) => theme.shadow.lg};
  padding: 16px 18px 18px;
  min-width: 280px;
`;

const Header = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const Title = styled.h3`
  margin: 0;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 15px;
  font-weight: 600;
  color: hsl(var(--foreground));
`;

const CloseButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: hsl(var(--muted-foreground));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: ${({ theme }) => theme.color.cream};
    color: hsl(var(--foreground));
  }
`;

const SliderRow = styled.div`
  padding: 8px 6px 4px;
`;

const ValueRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  color: hsl(var(--foreground));
`;

const XIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SLIDER_MIN = 0;
const SLIDER_MAX = 200;
const SLIDER_STEP = 5;

interface BoardPriceFilterProps {
  open: boolean;
  /** Tuple [min, max] — same shape as the upstream RangeSlider expects. */
  value: [number, number];
  onChange: (next: [number, number]) => void;
  onClose: () => void;
}

export const BoardPriceFilter: React.FC<BoardPriceFilterProps> = ({
  open,
  value,
  onChange,
  onClose,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  if (!open) return null;
  const [lo, hi] = value;
  const hiLabel = hi >= SLIDER_MAX ? `$${SLIDER_MAX}+` : `$${hi}`;
  return (
    <Panel ref={wrapRef} role="dialog" aria-label="Price range">
      <Header>
        <Title>Price range</Title>
        <CloseButton type="button" aria-label="Close" onClick={onClose}>
          <XIcon />
        </CloseButton>
      </Header>
      <SliderRow>
        <RangeSlider
          value={value}
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step={SLIDER_STEP}
          ariaLabelLower="Minimum price"
          ariaLabelUpper="Maximum price"
          onChange={onChange}
        />
      </SliderRow>
      <ValueRow>
        <span>${lo}</span>
        <span>{hiLabel}</span>
      </ValueRow>
    </Panel>
  );
};
