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
   *  the Refresh button (both the sticky floating one and the SummaryCard
   *  CTA) swap to a disabled, spinner-fronted "Refreshing…" loading state
   *  IN PLACE — no skeleton, no page jump. */
  refreshing?: boolean;
  /** Optional slot for the future MeSetupCard above the carousels. */
  topSlot?: React.ReactNode;
  /** End-of-session save/dismiss summary stats — when present AND
   *  `showSummary` is true, we render the beige summary card with the
   *  "the more you react…" hint and the Refresh CTA below the carousels. */
  summary?: {
    saves: number;
    dismissed: number;
  };
  /** Gates the summary card. Defaults to true for backwards-compat with
   *  callers that don't yet know whether products are loaded. The page sets
   *  this to false during PROCESSING / regenerate so the hint copy doesn't
   *  render under empty skeleton rows (bug #35). */
  showSummary?: boolean;
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

// Refreshing pill: visible above the carousels so the user has clear
// feedback that a refresh is in progress even when scrolled away from the
// bottom CTA. Bug #43 — without this, the dimmed-old-content + invisible
// "Refreshing…" button read as "broken" rather than "in progress".
const RefreshingPill = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  align-self: center;
  background: ${({ theme }) => theme.color.clay};
  color: #fff;
  font-family: inherit;
  font-weight: 500;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 9999px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const PillSpinner = styled.span`
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 800ms linear infinite;
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

const RefreshCta = styled.button<{ $refreshing: boolean }>`
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
  cursor: ${({ $refreshing }) => ($refreshing ? 'default' : 'pointer')};
  opacity: ${({ $refreshing }) => ($refreshing ? 0.85 : 1)};
  width: 100%;
  max-width: 360px;
  transition: opacity 150ms ease, transform 150ms ease;
  &:hover { opacity: ${({ $refreshing }) => ($refreshing ? 0.85 : 0.9)}; }
  &:active { transform: ${({ $refreshing }) => ($refreshing ? 'none' : 'scale(0.98)')}; }
  &:disabled { cursor: default; }
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
  showSummary = true,
  onRefresh,
  children,
}) => (
  <Wrap>
    {topSlot}

    {/* Visible refresh indicator above the carousels (bug #43). Without
        this, the dimmed-old-content + scrolled-away-from-bottom CTA read
        as "broken." Pill renders only while refreshing so it doesn't
        compete with the empty/sparse messages. */}
    {refreshing && (
      <RefreshingPill role="status" aria-live="polite">
        <PillSpinner aria-hidden="true" />
        Refreshing your picks…
      </RefreshingPill>
    )}

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

    {summary && showSummary && (
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
          <RefreshCta
            type="button"
            onClick={refreshing ? undefined : onRefresh}
            disabled={refreshing}
            aria-busy={refreshing || undefined}
            $refreshing={refreshing}
          >
            {refreshing ? (
              <>
                <Spinner aria-hidden="true" />
                Refreshing…
              </>
            ) : (
              <>
                <SparkleGlyph />
                Refresh my picks
              </>
            )}
          </RefreshCta>
        </SummaryInner>
      </SummaryCard>
    )}
  </Wrap>
);
