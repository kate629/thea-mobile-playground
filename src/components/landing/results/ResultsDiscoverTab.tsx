import React from 'react';
import styled from 'styled-components';

export interface ResultsDiscoverTabProps {
  /** True when no carousel rows have any visible products (e.g. price filter
   *  excludes everything). */
  empty?: boolean;
  /** True when at least one row still has products but the total visible
   *  count is sparse (< 4). Triggers the "Running low on picks" prompt. */
  sparse?: boolean;
  /** True when a refresh is in flight. Carousels render at opacity 0.6 and
   *  a fixed-position floating "Updating" indicator overlays. */
  refreshing?: boolean;
  /** Optional slot for the future MeSetupCard above the carousels. */
  topSlot?: React.ReactNode;
  /** End-of-session save/dismiss summary stats — when present, we render
   *  the beige summary card with the Refresh CTA below the carousels. */
  summary?: {
    saves: number;
    dismissed: number;
  };
  onRefresh?: () => void;
  /** Carousel rows. Caller composes <ResultsCarousel> or
   *  <ResultsCarouselAnimated> instances. */
  children: React.ReactNode;
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 16px;
  @media (min-width: 1024px) { gap: 40px; }
`;

const EmptyCard = styled.div`
  border: 1px dashed hsl(var(--border));
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.4);
  padding: 32px;
  text-align: center;
`;

const EmptyTitle = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: hsl(var(--foreground));
`;

const EmptyHint = styled.p`
  margin: 8px 0 0 0;
  font-size: 14px;
  color: hsl(var(--muted-foreground));
`;

const CarouselsWrap = styled.div<{ $refreshing: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 24px;
  opacity: ${({ $refreshing }) => ($refreshing ? 0.6 : 1)};
  pointer-events: ${({ $refreshing }) => ($refreshing ? 'none' : 'auto')};
  transition: opacity 200ms ease;
  @media (min-width: 1024px) { gap: 40px; }
`;

const SparsePrompt = styled.p`
  margin: 0;
  padding: 8px 16px;
  text-align: center;
  font-size: 14px;
  color: hsl(var(--muted-foreground));
`;

const RefreshLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  font-weight: 600;
  color: hsl(var(--primary));
  cursor: pointer;
  transition: opacity 150ms ease;
  &:hover { opacity: 0.8; }
`;

const FloatingUpdating = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 20px);
  z-index: 40;
  display: flex;
  justify-content: center;
  pointer-events: none;
`;

const UpdatingPill = styled.button`
  pointer-events: auto;
  background: ${({ theme }) => theme.color.clay};
  color: #fff;
  font-family: inherit;
  font-weight: 600;
  font-size: 15px;
  height: 48px;
  padding: 0 22px;
  border-radius: 9999px;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  opacity: 0.9;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  cursor: default;
`;

const Spinner = styled.span`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 800ms linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const SummaryCard = styled.div`
  background: ${({ theme }) => theme.color.cream};
  width: 100%;
  padding: 40px 16px;
  margin-top: 16px;
  @media (min-width: 640px) { padding: 40px 32px; }
`;

const SummaryInner = styled.div`
  max-width: 672px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SummaryStatsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 12px;
  margin-bottom: 12px;
  font-size: 17px;
  color: ${({ theme }) => theme.color.inkSoft};
`;

const SummaryStat = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const SummaryDot = styled.span`
  color: hsl(var(--muted-foreground));
`;

const SummaryHint = styled.p`
  margin: 0 0 20px 0;
  text-align: center;
  font-size: 16px;
  color: hsl(var(--muted-foreground));
`;

const RefreshCta = styled.button`
  background: ${({ theme }) => theme.color.clay};
  color: #fff;
  font-family: inherit;
  font-weight: 600;
  font-size: 15px;
  height: 48px;
  padding: 0 32px;
  border-radius: 8px;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  width: 100%;
  max-width: 360px;
  transition: opacity 150ms ease, transform 150ms ease;
  &:hover { opacity: 0.9; }
  &:active { transform: scale(0.98); }
`;

const HeartGlyph: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ color: '#B56B58' }}>
    <path d="M12 21s-7-4.35-9.6-9.05a5.6 5.6 0 0 1 9.6-5.78 5.6 5.6 0 0 1 9.6 5.78C19 16.65 12 21 12 21Z" />
  </svg>
);

const XGlyph: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: '#8C8279' }}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SparkleGlyph: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 3 13.5 9 19.5 10.5 13.5 12 12 18 10.5 12 4.5 10.5 10.5 9 12 3Z" />
  </svg>
);

export const ResultsDiscoverTab: React.FC<ResultsDiscoverTabProps> = ({
  empty = false,
  sparse = false,
  refreshing = false,
  topSlot,
  summary,
  onRefresh,
  children,
}) => (
  <Wrap>
    {topSlot}

    {empty && !refreshing && (
      <EmptyCard>
        <EmptyTitle>No gifts match this price filter.</EmptyTitle>
        <EmptyHint>Try widening the price range from the profile.</EmptyHint>
      </EmptyCard>
    )}

    <CarouselsWrap $refreshing={refreshing}>{children}</CarouselsWrap>

    {sparse && !refreshing && (
      <SparsePrompt>
        Running low on picks —{' '}
        <RefreshLink type="button" onClick={onRefresh}>Refresh my picks</RefreshLink>{' '}
        for a fresh batch.
      </SparsePrompt>
    )}

    {refreshing ? (
      <>
        <div aria-hidden style={{ height: 96 }} />
        <FloatingUpdating>
          <UpdatingPill type="button" disabled>
            Updating
            <Spinner aria-hidden="true" />
          </UpdatingPill>
        </FloatingUpdating>
      </>
    ) : (
      summary && (
        <SummaryCard>
          <SummaryInner>
            <SummaryStatsRow>
              <SummaryStat>
                <HeartGlyph />
                <strong>{summary.saves}</strong>
                <span>saves</span>
              </SummaryStat>
              <SummaryDot aria-hidden="true">·</SummaryDot>
              <SummaryStat>
                <XGlyph />
                <strong>{summary.dismissed}</strong>
                <span>dismissed</span>
              </SummaryStat>
            </SummaryStatsRow>
            <SummaryHint>The more you react, the better your picks.</SummaryHint>
            <RefreshCta type="button" onClick={onRefresh}>
              <SparkleGlyph />
              Refresh my picks
            </RefreshCta>
          </SummaryInner>
        </SummaryCard>
      )
    )}
  </Wrap>
);
