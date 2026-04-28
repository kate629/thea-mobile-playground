import React from 'react';
import styled from 'styled-components';
import { Card } from '../../ui/Card';
import { IconFeature } from '../../ui/IconFeature';

export interface ValuePropItem {
  emoji: string;
  title: string;
  body: string;
}

export interface ValuePropsCardProps {
  /** Heading content. Accepts a plain string or a JSX node so callers can
   *  break the line where they want (e.g. "You love them." / "Let it show."
   *  on two lines). */
  heading: React.ReactNode;
  items: ValuePropItem[];
}

const OuterWrap = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 56px 16px 0;
  @media (min-width: 640px) { padding: 56px 32px 0; }
  @media (min-width: 1024px) { padding: 56px 64px 0; }
`;

const Heading = styled.h2`
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: hsl(var(--foreground));
  text-align: center;
  margin: 0 0 48px 0;
  line-height: 1.1;
  @media (min-width: 768px) {
    font-size: 48px;
    margin: 0 0 80px 0;
  }
`;

const Row = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;
  @media (min-width: 768px) {
    flex-direction: row;
    align-items: flex-start;
    gap: 64px;
  }
`;

export const ValuePropsCard: React.FC<ValuePropsCardProps> = ({ heading, items }) => (
  <OuterWrap>
    <Card bg="#F5F0EB" radius="24px" padding="96px 80px" paddingMobile="48px 32px">
      <Heading>{heading}</Heading>
      <Row>
        {items.map((item) => (
          <IconFeature key={item.title} emoji={item.emoji} title={item.title} body={item.body} />
        ))}
      </Row>
    </Card>
  </OuterWrap>
);
