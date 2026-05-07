import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

/**
 * Compact price-range filter anchored below the pill row. Tap the $ button
 * in BoardHeader to open. Two number inputs for min/max with $ prefixes.
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

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Field = styled.label`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: hsl(var(--muted-foreground));
`;

const InputWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid ${({ theme }) => theme.color.warmBorder};
  border-radius: 12px;
  padding: 8px 10px;
  background: ${({ theme }) => theme.color.cream};
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  color: hsl(var(--foreground));
  &:focus-within {
    border-color: ${({ theme }) => theme.color.clay};
    background: #ffffff;
  }
`;

const PriceInput = styled.input`
  border: none;
  background: transparent;
  outline: none;
  font: inherit;
  color: inherit;
  width: 100%;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const Dash = styled.span`
  color: hsl(var(--muted-foreground));
  font-size: 14px;
  padding-top: 14px;
`;

const XIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface BoardPriceFilterProps {
  open: boolean;
  min: number | '';
  max: number | '';
  onChangeMin: (v: number | '') => void;
  onChangeMax: (v: number | '') => void;
  onClose: () => void;
}

export const BoardPriceFilter: React.FC<BoardPriceFilterProps> = ({
  open,
  min,
  max,
  onChangeMin,
  onChangeMax,
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
  const parse = (v: string): number | '' => (v.trim() === '' ? '' : Math.max(0, Number(v) || 0));

  return (
    <Panel ref={wrapRef} role="dialog" aria-label="Price range">
      <Header>
        <Title>Price range</Title>
        <CloseButton type="button" aria-label="Close" onClick={onClose}>
          <XIcon />
        </CloseButton>
      </Header>
      <Row>
        <Field>
          Min
          <InputWrap>
            <span>$</span>
            <PriceInput
              type="number"
              inputMode="numeric"
              min={0}
              value={min === '' ? '' : String(min)}
              onChange={(e) => onChangeMin(parse(e.target.value))}
              placeholder="0"
            />
          </InputWrap>
        </Field>
        <Dash>–</Dash>
        <Field>
          Max
          <InputWrap>
            <span>$</span>
            <PriceInput
              type="number"
              inputMode="numeric"
              min={0}
              value={max === '' ? '' : String(max)}
              onChange={(e) => onChangeMax(parse(e.target.value))}
              placeholder="200+"
            />
          </InputWrap>
        </Field>
      </Row>
    </Panel>
  );
};
