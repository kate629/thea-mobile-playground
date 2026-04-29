import React from 'react';
import styled from 'styled-components';

export interface MothersDayQuizBannerProps {
  /** Same handler the OccasionPage sticky CTA fires — navigates to /quiz. */
  onCtaClick?: () => void;
}

const Card = styled.div`
  border-radius: 16px;
  padding: 48px 24px;
  background: hsl(36, 33%, 96%);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  text-align: center;
  @media (min-width: 768px) {
    padding: 64px 48px;
  }
`;

const Heading = styled.p`
  margin: 0;
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #b56b58;
  @media (min-width: 768px) {
    font-size: 44px;
  }
`;

const Subhead = styled.p`
  margin: 12px 0 0;
  font-size: 18px;
  color: hsl(var(--muted-foreground));
  @media (min-width: 768px) {
    font-size: 20px;
  }
`;

const CtaButton = styled.button`
  margin-top: 24px;
  display: inline-block;
  padding: 12px 32px;
  border: none;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--primary-foreground));
  background: linear-gradient(135deg, #b56b58, #b56b58cc);
  cursor: pointer;
  transition: opacity 200ms ease;
  &:hover { opacity: 0.9; }
  &:focus-visible { outline: 2px solid #b56b58; outline-offset: 3px; }
`;

export const MothersDayQuizBanner: React.FC<MothersDayQuizBannerProps> = ({
  onCtaClick,
}) => (
  <Card>
    <Heading>She&rsquo;s one of a kind.</Heading>
    <Subhead>Find a gift just for her.</Subhead>
    <CtaButton type="button" onClick={onCtaClick}>
      Take the gift quiz &rarr;
    </CtaButton>
  </Card>
);
