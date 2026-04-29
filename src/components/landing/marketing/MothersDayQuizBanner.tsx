import React, { useCallback, useRef } from 'react';
import styled from 'styled-components';
import { useCarouselImpression } from '../../../theaWeb/hooks/useCarouselImpression';
import {
  gaSelectPromotion,
  gaViewPromotion,
  type GaPromotionParams,
} from '../../../theaWeb/lib/gaPixel';
import { metaPromoClick } from '../../../theaWeb/lib/metaPixel';

export interface MothersDayQuizBannerProps {
  /** Same handler the OccasionPage sticky CTA fires — navigates to /quiz. */
  onCtaClick?: () => void;
}

// Stable promotion identity for the dashboard. If the creative changes
// (copy / imagery / CTA), bump `creative_name` so before/after engagement
// numbers don't blend.
const PROMOTION_PARAMS: GaPromotionParams = {
  promotion_id: 'md_quiz_cta',
  promotion_name: "Mother's Day quiz CTA",
  creative_name: 'mothers_day_banner_v1',
  location_id: 'occasion_mothers_day_mid_carousel',
};

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
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  // Fire view_promotion exactly once when the banner is ≥50% in view. Same
  // shared IntersectionObserver as the carousels — see useCarouselImpression.
  const fireView = useCallback(() => gaViewPromotion(PROMOTION_PARAMS), []);
  useCarouselImpression(cardRef, fireView);

  const handleClick = useCallback(() => {
    gaSelectPromotion(PROMOTION_PARAMS);
    metaPromoClick(PROMOTION_PARAMS);
    onCtaClick?.();
  }, [onCtaClick]);

  return (
    <Card ref={cardRef}>
      <Heading>She&rsquo;s one of a kind.</Heading>
      <Subhead>Find a gift just for her.</Subhead>
      <CtaButton type="button" onClick={handleClick}>
        Take the gift quiz &rarr;
      </CtaButton>
    </Card>
  );
};
