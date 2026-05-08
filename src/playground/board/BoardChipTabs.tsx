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
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border-bottom: 1px solid hsl(var(--border));
  padding: 10px 12px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }
`;

// Pill-button tab. Filled dark background when active, outlined cream
// when inactive — visually reads as a control the user picks one of,
// not a flat underline label. Older ICP-friendly: button shape signals
// "tap me" louder than an underline ever does.
const Tab = styled.button<{ $active: boolean }>`
  flex: 0 0 auto;
  padding: 8px 14px;
  border-radius: 9999px;
  cursor: pointer;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background 150ms ease, color 150ms ease, border-color 150ms ease;

  background: ${({ $active }) => ($active ? '#2D2D2D' : '#F5F1EC')};
  color: ${({ $active }) =>
    $active ? '#ffffff' : 'hsl(var(--foreground))'};
  border: 1px solid
    ${({ $active }) => ($active ? '#2D2D2D' : 'hsl(var(--border))')};

  &:hover {
    background: ${({ $active }) => ($active ? '#1c1c1c' : '#ECE6DD')};
  }
  &:active {
    transform: scale(0.98);
  }
`;

// Trailing "+ More" — same pill geometry as Tab, slightly muted so it
// reads as an action rather than another category.
const TrailingButton = styled.button`
  flex: 0 0 auto;
  padding: 8px 14px;
  border-radius: 9999px;
  cursor: pointer;
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  color: hsl(var(--muted-foreground));
  border: 1px dashed hsl(var(--border));
  transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
  &:hover {
    color: hsl(var(--foreground));
    border-color: hsl(var(--foreground) / 0.4);
  }
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
}) => {
  // Center the tapped tab in the strip on selection. The browser
  // clamps automatically — tapping a tab near the start or end won't
  // overscroll past the bar's edges. Standard iOS/Material tab pattern.
  const handleTabClick = (key: string) =>
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onChange(key);
      e.currentTarget.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    };

  return (
    <Bar role="tablist" aria-label="Interest categories">
      {tabs.map((t) => {
        const active = t.key === activeKey;
        return (
          <Tab
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active}
            $active={active}
            onClick={handleTabClick(t.key)}
          >
            {t.emoji && <span aria-hidden="true">{t.emoji}</span>}
            <span>{t.label}</span>
          </Tab>
        );
      })}
      {trailingLabel && onTrailingClick && (
        <TrailingButton type="button" onClick={onTrailingClick}>
          <span aria-hidden="true">+</span> {trailingLabel}
        </TrailingButton>
      )}
    </Bar>
  );
};
