import React from 'react';
import styled from 'styled-components';
import { TabBar } from './TabBar';
import { badgePop } from '../../animations';

export default {
  title: 'UI/TabBar',
  component: TabBar,
};

type DemoKey = 'recommended' | 'liked' | 'purchased';

/* Filled heart used as the Saved tab badge — matches the source's
   Heart icon at 14×14 with full clay fill (ResultsPageAuth.tsx:1471–1487). */
const HeartBadge = styled.span`
  display: inline-flex;
  width: 14px;
  height: 14px;
  animation: ${badgePop} 250ms ease-out;
  &::before {
    content: '';
    width: 14px;
    height: 14px;
    background: ${({ theme }) => theme.color.clay};
    -webkit-mask-image: url("data:image/svg+xml;utf8,<svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><path fill='black' d='M12 21s-7-4.35-9.6-9.05a5.6 5.6 0 0 1 9.6-5.78 5.6 5.6 0 0 1 9.6 5.78C19 16.65 12 21 12 21Z'/></svg>");
    mask-image: url("data:image/svg+xml;utf8,<svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><path fill='black' d='M12 21s-7-4.35-9.6-9.05a5.6 5.6 0 0 1 9.6-5.78 5.6 5.6 0 0 1 9.6 5.78C19 16.65 12 21 12 21Z'/></svg>");
    -webkit-mask-size: contain;
    mask-size: contain;
  }
`;

const NumericBadge = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 9999px;
  background: ${({ theme, $active }) => ($active ? theme.color.clay : 'hsl(var(--muted-foreground))')};
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  animation: ${badgePop} 250ms ease-out;
`;

const Wrap = styled.div`
  width: 720px;
  max-width: 100%;
  background: ${({ theme }) => theme.color.creamLight};
  padding: 16px;
`;

export const Empty = {
  render: () => {
    const [value, setValue] = React.useState<DemoKey>('recommended');
    return (
      <Wrap>
        <TabBar
          tabs={[
            { key: 'recommended', label: 'Discover' },
            { key: 'liked', label: 'Saved' },
            { key: 'purchased', label: 'Purchased' },
          ]}
          value={value}
          onChange={setValue}
        />
      </Wrap>
    );
  },
};

export const WithHeartBadge = {
  render: () => (
    <Wrap>
      <TabBar
        tabs={[
          { key: 'recommended', label: 'Discover' },
          { key: 'liked', label: 'Saved', badge: <HeartBadge aria-label="3 saved" /> },
          { key: 'purchased', label: 'Purchased' },
        ]}
        value={'liked' as DemoKey}
        onChange={() => {}}
      />
    </Wrap>
  ),
};

export const BothBadges = {
  render: () => (
    <Wrap>
      <TabBar
        tabs={[
          { key: 'recommended', label: 'Discover' },
          { key: 'liked', label: 'Saved', badge: <HeartBadge aria-label="3 saved" /> },
          { key: 'purchased', label: 'Purchased', badge: <NumericBadge $active={false}>2</NumericBadge> },
        ]}
        value={'recommended' as DemoKey}
        onChange={() => {}}
      />
    </Wrap>
  ),
};
