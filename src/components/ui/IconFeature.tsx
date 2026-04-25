import React from 'react';
import styled from 'styled-components';

export interface IconFeatureProps {
  emoji: string;
  title: string;
  body: string;
}

/* Mobile: row (emoji left of text). Desktop: column (emoji centered above
   centered text). Mirrors the inline JSX in
   3-12-sovrn-launch-version/src/pages/LandingAuth.tsx:709-716. */
const Root = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;
  align-items: flex-start;
  @media (min-width: 768px) {
    flex: 1;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 20px;
  }
`;

const Emoji = styled.div`
  font-size: 30px;
  line-height: 1.1;
  flex-shrink: 0;
  @media (min-width: 768px) {
    font-size: 48px;
  }
`;

const TextBlock = styled.div`
  display: block;
`;

const Title = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: hsl(var(--foreground));
  margin: 0 0 8px 0;
  @media (min-width: 768px) {
    font-size: 24px;
    margin: 0 0 12px 0;
  }
`;

const Body = styled.p`
  font-size: 16px;
  line-height: 1.5;
  color: hsl(var(--muted-foreground));
  margin: 0;
  @media (min-width: 768px) {
    font-size: 17px;
  }
`;

export const IconFeature: React.FC<IconFeatureProps> = ({ emoji, title, body }) => (
  <Root>
    <Emoji>{emoji}</Emoji>
    <TextBlock>
      <Title>{title}</Title>
      <Body>{body}</Body>
    </TextBlock>
  </Root>
);
