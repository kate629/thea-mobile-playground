import React from 'react';
import styled from 'styled-components';

export interface ChipTab {
  key: string;
  label: string;
  count?: number;
}

const Bar = styled.div`
  position: sticky;
  top: 0;
  z-index: 5;
  background: ${({ theme }) => theme.color.creamLight};
  padding: 8px 4px 4px;
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }
`;

const Pill = styled.button<{ $active: boolean }>`
  flex: 0 0 auto;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid ${({ $active }) =>
    $active ? 'transparent' : 'hsl(var(--border))'};
  background: ${({ $active, theme }) =>
    $active ? theme.color.clay : '#ffffff'};
  color: ${({ $active }) =>
    $active ? '#ffffff' : 'hsl(var(--foreground))'};
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 150ms ease, color 150ms ease, border-color 150ms ease;

  &:active { transform: scale(0.97); }
`;

interface BoardChipTabsProps {
  tabs: ChipTab[];
  activeKey: string;
  onChange: (key: string) => void;
}

export const BoardChipTabs: React.FC<BoardChipTabsProps> = ({
  tabs,
  activeKey,
  onChange,
}) => (
  <Bar role="tablist" aria-label="Interest chips">
    {tabs.map((t) => (
      <Pill
        key={t.key}
        type="button"
        role="tab"
        aria-selected={t.key === activeKey}
        $active={t.key === activeKey}
        onClick={() => onChange(t.key)}
      >
        {t.label}
      </Pill>
    ))}
  </Bar>
);
