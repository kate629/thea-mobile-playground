import React from 'react';
import styled, { css } from 'styled-components';
import { QuestPillSegmentKey, QuestPillSegments } from './types';

export interface QuestSummaryPillProps {
  segments: QuestPillSegments;
  /** Open segment for the dropdown affordance. Stories drive this directly. */
  openSegment?: QuestPillSegmentKey | null;
  onSegmentClick: (key: QuestPillSegmentKey) => void;
  onClearSegment?: (key: QuestPillSegmentKey) => void;
  onSparkleClick: () => void;
  /** Sparkle button is disabled until the user picks at least one segment value. */
  canSearch?: boolean;
  /** Sparkle button busy spinner. */
  launching?: boolean;
  /** Mobile single-pill layout used in place of the three-segment pill below `md`. */
  compact?: boolean;
  /** Slot to render the dropdown panel below the pill (when `openSegment` is set). */
  dropdown?: React.ReactNode;
}

const Wrap = styled.div`
  width: 100%;
  padding: 32px 16px;
`;

const Container = styled.div`
  position: relative;
  margin: 0 auto;
  max-width: 700px;
`;

const Pill = styled.div`
  border-radius: 9999px;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--background));
  box-shadow: var(--shadow-soft);
  transition: box-shadow 200ms ease;
`;

const Row = styled.div`
  display: flex;
  height: 56px;
  align-items: stretch;
`;

interface SegmentBoxProps {
  $width: string;
}
const SegmentBox = styled.div<SegmentBoxProps>`
  position: relative;
  display: flex;
  min-width: 0;
  align-items: center;
  flex-basis: ${({ $width }) => $width};
`;

interface SegmentButtonProps {
  $isOpen: boolean;
  $anyOpen: boolean;
}
const SegmentButton = styled.button<SegmentButtonProps>`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  width: 100%;
  min-width: 0;
  padding: 0 20px;
  text-align: left;
  border: 1px solid transparent;
  border-radius: 9999px;
  background: transparent;
  cursor: pointer;
  transition: all 200ms ease-out;

  ${({ $anyOpen, $isOpen }) =>
    $anyOpen && !$isOpen
      ? css`
          background: hsl(var(--muted) / 0.6);
        `
      : ''}

  ${({ $isOpen }) =>
    $isOpen
      ? css`
          z-index: 1;
          transform: scale(1.02);
          border-color: hsl(var(--border));
          background: hsl(var(--background));
          box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.08);
        `
      : ''}

  &:focus {
    outline: none;
  }
  &:focus-visible {
    box-shadow: 0 0 0 2px hsl(var(--primary));
  }
`;

const Label = styled.span`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: hsl(var(--muted-foreground));
`;

interface ValueProps {
  $filled: boolean;
}
const Value = styled.span<ValueProps>`
  display: block;
  padding-top: 2px;
  padding-right: 32px;
  font-size: 14px;
  color: ${({ $filled }) =>
    $filled ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ClearButton = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  width: 44px;
  border: none;
  background: transparent;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  &:hover {
    color: hsl(var(--foreground));
  }
`;

const Divider = styled.div`
  height: 32px;
  width: 1px;
  background: hsl(var(--border));
`;

const SparkleSlot = styled.div`
  display: flex;
  align-items: center;
  padding-right: 8px;
`;

const SparkleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  width: 44px;
  border: none;
  border-radius: 9999px;
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  cursor: pointer;
  transition: opacity 150ms ease;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  &:focus {
    outline: none;
  }
  &:focus-visible {
    box-shadow: 0 0 0 2px hsl(var(--primary)), 0 0 0 4px hsl(var(--background));
  }
`;

const DropdownSlot = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  z-index: 40;
  margin-top: 12px;
`;

/* Compact (mobile) variant */
const CompactRow = styled.div`
  display: flex;
  align-items: center;
  height: 52px;
  padding-left: 20px;
  padding-right: 6px;
  gap: 12px;
`;

const CompactLabel = styled.span`
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--foreground));
`;

const SegmentWidth: Record<QuestPillSegmentKey, string> = {
  who: '35%',
  what: '30%',
  likes: '35%',
};

const SparkleGlyph: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    <path d="M12 8l1.4 2.6L16 12l-2.6 1.4L12 16l-1.4-2.6L8 12l2.6-1.4z" fill="currentColor" stroke="none" />
  </svg>
);

const ClearGlyph: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 6l12 12M6 18l12-12" />
  </svg>
);

const Spinner = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-right-color: transparent;
  animation: spin 700ms linear infinite;
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export const QuestSummaryPill: React.FC<QuestSummaryPillProps> = ({
  segments,
  openSegment = null,
  onSegmentClick,
  onClearSegment,
  onSparkleClick,
  canSearch = true,
  launching = false,
  compact = false,
  dropdown,
}) => {
  if (compact) {
    return (
      <Wrap>
        <Container>
          <Pill>
            <CompactRow>
              <CompactLabel>Find a gift</CompactLabel>
              <SparkleButton
                type="button"
                onClick={onSparkleClick}
                disabled={!canSearch || launching}
                aria-label="Search"
              >
                {launching ? <Spinner /> : <SparkleGlyph />}
              </SparkleButton>
            </CompactRow>
          </Pill>
        </Container>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <Container>
        <Pill>
          <Row>
            {segments.map((segment, index) => {
              const isOpen = openSegment === segment.key;
              const anyOpen = openSegment !== null;
              const nextSegment = segments[index + 1];
              const hideDivider = isOpen || (nextSegment && openSegment === nextSegment.key);
              return (
                <SegmentBox key={segment.key} $width={SegmentWidth[segment.key]}>
                  <SegmentButton
                    type="button"
                    $isOpen={isOpen}
                    $anyOpen={anyOpen}
                    onClick={() => onSegmentClick(segment.key)}
                  >
                    <Label>{segment.label}</Label>
                    <Value $filled={segment.filled}>{segment.value}</Value>
                  </SegmentButton>
                  {segment.filled && onClearSegment && (
                    <ClearButton
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearSegment(segment.key);
                      }}
                      aria-label={`Clear ${segment.label}`}
                    >
                      <ClearGlyph />
                    </ClearButton>
                  )}
                  {index < 2 && !hideDivider && <Divider />}
                </SegmentBox>
              );
            })}
            <SparkleSlot>
              <SparkleButton
                type="button"
                onClick={onSparkleClick}
                disabled={!canSearch || launching}
                aria-label="Search"
              >
                {launching ? <Spinner /> : <SparkleGlyph />}
              </SparkleButton>
            </SparkleSlot>
          </Row>
        </Pill>
        {openSegment && dropdown && <DropdownSlot>{dropdown}</DropdownSlot>}
      </Container>
    </Wrap>
  );
};
