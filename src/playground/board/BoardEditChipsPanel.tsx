import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Chip } from '../../components/ui/Chip';
import { CANONICAL_CHIPS } from './canonicalChips';

/**
 * Inline edit panel for the chip-tab strip. Shows every canonical chip;
 * selected ones render filled (active), unselected ones render outlined.
 * Tapping toggles. Closes on outside-click or X.
 *
 * Positioned absolutely below the chip strip so it feels anchored — same
 * pattern as the search-pill dropdowns elsewhere in the playground.
 */

const Wrap = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 8px;
  right: 8px;
  z-index: 25;
  background: #ffffff;
  border: 1px solid ${({ theme }) => theme.color.warmBorder};
  border-radius: 18px;
  box-shadow: ${({ theme }) => theme.shadow.lg};
  padding: 16px 18px 18px;
  max-height: 70vh;
  overflow-y: auto;
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
  transition: background 150ms ease, color 150ms ease;
  &:hover {
    background: ${({ theme }) => theme.color.cream};
    color: hsl(var(--foreground));
  }
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const XIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface BoardEditChipsPanelProps {
  open: boolean;
  selectedKeys: Set<string>;
  onToggle: (key: string) => void;
  onClose: () => void;
}

export const BoardEditChipsPanel: React.FC<BoardEditChipsPanelProps> = ({
  open,
  selectedKeys,
  onToggle,
  onClose,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);

  // Outside-click closes the panel.
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
  return (
    <Wrap ref={wrapRef} role="dialog" aria-label="Edit interest categories">
      <Header>
        <Title>Edit categories</Title>
        <CloseButton type="button" aria-label="Close" onClick={onClose}>
          <XIcon />
        </CloseButton>
      </Header>
      <ChipRow>
        {CANONICAL_CHIPS.map((c) => (
          <Chip
            key={c.key}
            selected={selectedKeys.has(c.key)}
            leading={<span aria-hidden="true">{c.emoji}</span>}
            onClick={() => onToggle(c.key)}
          >
            {c.label}
          </Chip>
        ))}
      </ChipRow>
    </Wrap>
  );
};
