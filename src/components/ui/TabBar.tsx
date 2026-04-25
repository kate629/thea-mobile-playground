import React from 'react';
import styled from 'styled-components';

export interface TabBarTab<K extends string> {
  key: K;
  label: string;
  badge?: React.ReactNode;
}

export interface TabBarProps<K extends string> {
  tabs: TabBarTab<K>[];
  value: K;
  onChange: (key: K) => void;
}

const Bar = styled.div`
  display: flex;
  align-items: flex-end;
  width: 100%;
  border-bottom: 1px solid ${({ theme }) => theme.color.warmBorder};
`;

const TabButton = styled.button<{ $active: boolean }>`
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  padding: 6px 0 10px 0;
  cursor: pointer;
  color: ${({ $active }) =>
    $active ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'};
  transition: color 150ms ease;
  &:focus-visible {
    outline: none;
  }
  @media (min-width: 768px) {
    font-size: 18px;
  }
`;

const TabInner = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 2px;
  border-bottom: 1px solid
    ${({ $active }) => ($active ? 'hsl(var(--foreground))' : 'transparent')};
`;

export function TabBar<K extends string>({ tabs, value, onChange }: TabBarProps<K>) {
  return (
    <Bar role="tablist">
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <TabButton
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            $active={active}
            onClick={() => onChange(tab.key)}
          >
            <TabInner $active={active}>
              {tab.label}
              {tab.badge}
            </TabInner>
          </TabButton>
        );
      })}
    </Bar>
  );
}
