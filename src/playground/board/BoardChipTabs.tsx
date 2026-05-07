import React from 'react';
import styled from 'styled-components';

export interface ChipTab {
  key: string;
  label: string;
  emoji?: string;
  count?: number;
}

const Bar = styled.div`
  display: flex;
  align-items: stretch;
  background: #ffffff;
  border-bottom: 1px solid hsl(var(--border));
  padding: 0 12px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 0 0 auto;
  padding: 14px 14px 12px;
  background: transparent;
  border: none;
  position: relative;
  cursor: pointer;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 16px;
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  color: ${({ $active }) =>
    $active ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'};
  white-space: nowrap;
  transition: color 150ms ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    color: hsl(var(--foreground));
  }

  &::after {
    content: '';
    position: absolute;
    left: 14px;
    right: 14px;
    bottom: -1px;
    height: 2px;
    background: ${({ $active, theme }) =>
      $active ? theme.color.clay : 'transparent'};
    border-radius: 2px 2px 0 0;
    transition: background 150ms ease;
  }
`;

// Trailing button styled distinctly from category tabs — no underline
// indicator, slightly muted, reads as an action ("+ More") rather than
// another category.
const TrailingButton = styled.button`
  flex: 0 0 auto;
  padding: 14px 14px 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 16px;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: color 150ms ease;
  &:hover { color: hsl(var(--foreground)); }
`;

interface BoardChipTabsProps {
  tabs: ChipTab[];
  activeKey: string;
  onChange: (key: string) => void;
  /** Optional trailing action — e.g. "+ More" button to open the chip
   *  edit panel. Renders after the last tab in the strip. */
  trailingLabel?: string;
  onTrailingClick?: () => void;
}

export const BoardChipTabs: React.FC<BoardChipTabsProps> = ({
  tabs,
  activeKey,
  onChange,
  trailingLabel,
  onTrailingClick,
}) => (
  <Bar role="tablist" aria-label="Interest categories">
    {tabs.map((t) => (
      <Tab
        key={t.key}
        type="button"
        role="tab"
        aria-selected={t.key === activeKey}
        $active={t.key === activeKey}
        onClick={() => onChange(t.key)}
      >
        {t.emoji && <span aria-hidden="true">{t.emoji}</span>}
        {t.label}
      </Tab>
    ))}
    {trailingLabel && onTrailingClick && (
      <TrailingButton type="button" onClick={onTrailingClick}>
        <span aria-hidden="true">+</span> {trailingLabel}
      </TrailingButton>
    )}
  </Bar>
);
