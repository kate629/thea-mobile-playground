import React from 'react';
import { QuestSummaryPill } from './QuestSummaryPill';
import { PLACEHOLDER_SEGMENTS, makeFilledSegment } from './constants';
import { QuestPillSegmentKey, QuestPillSegments } from './types';

export default {
  title: 'Surfaces/Dashboard/QuestSummaryPill',
  component: QuestSummaryPill,
};

const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ minHeight: 280, background: 'hsl(var(--background))' }}>{children}</div>
);

const RESOLVED: QuestPillSegments = [
  makeFilledSegment('who', 'Mom, 60s'),
  makeFilledSegment('what', 'Birthday'),
  makeFilledSegment('likes', 'Cooking, Travel'),
];

const PartialResolved: QuestPillSegments = [
  makeFilledSegment('who', 'Brother, 30s'),
  PLACEHOLDER_SEGMENTS[1],
  PLACEHOLDER_SEGMENTS[2],
];

export const AllPlaceholders = {
  render: () => (
    <Frame>
      <QuestSummaryPill
        segments={PLACEHOLDER_SEGMENTS}
        onSegmentClick={() => {}}
        onSparkleClick={() => {}}
        canSearch={false}
      />
    </Frame>
  ),
};

export const PartiallyFilled = {
  render: () => (
    <Frame>
      <QuestSummaryPill
        segments={PartialResolved}
        onSegmentClick={() => {}}
        onClearSegment={() => {}}
        onSparkleClick={() => {}}
      />
    </Frame>
  ),
};

export const AllResolved = {
  render: () => (
    <Frame>
      <QuestSummaryPill
        segments={RESOLVED}
        onSegmentClick={() => {}}
        onClearSegment={() => {}}
        onSparkleClick={() => {}}
      />
    </Frame>
  ),
};

const sampleDropdown = (label: string) => (
  <div
    style={{
      padding: 24,
      borderRadius: 12,
      background: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
      fontSize: 14,
      color: 'hsl(var(--muted-foreground))',
    }}
  >
    Dropdown content for the {label} segment goes here. v1 ships this slot empty so the
    pill design can land independently.
  </div>
);

export const WhatOpen = {
  render: () => (
    <Frame>
      <QuestSummaryPill
        segments={PartialResolved}
        openSegment="what"
        onSegmentClick={() => {}}
        onClearSegment={() => {}}
        onSparkleClick={() => {}}
        canSearch={false}
        dropdown={sampleDropdown('WHAT')}
      />
    </Frame>
  ),
};

export const LikesOpen = {
  render: () => (
    <Frame>
      <QuestSummaryPill
        segments={RESOLVED}
        openSegment="likes"
        onSegmentClick={() => {}}
        onClearSegment={() => {}}
        onSparkleClick={() => {}}
        dropdown={sampleDropdown('LIKES')}
      />
    </Frame>
  ),
};

export const SecondSegmentOpenWithFilledNeighbors = {
  name: 'WHAT open with WHO+LIKES filled',
  render: () => (
    <Frame>
      <QuestSummaryPill
        segments={RESOLVED}
        openSegment="what"
        onSegmentClick={() => {}}
        onClearSegment={() => {}}
        onSparkleClick={() => {}}
        dropdown={sampleDropdown('WHAT')}
      />
    </Frame>
  ),
};

export const WhoOpen = {
  render: () => (
    <Frame>
      <QuestSummaryPill
        segments={PLACEHOLDER_SEGMENTS}
        openSegment="who"
        onSegmentClick={() => {}}
        onSparkleClick={() => {}}
        canSearch={false}
        dropdown={
          <div
            style={{
              padding: 24,
              borderRadius: 12,
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              fontSize: 14,
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            Dropdown content (relationship picker, age picker) goes here in production. v1 ships
            this slot empty so the design can land independently.
          </div>
        }
      />
    </Frame>
  ),
};

export const Launching = {
  render: () => (
    <Frame>
      <QuestSummaryPill
        segments={RESOLVED}
        onSegmentClick={() => {}}
        onClearSegment={() => {}}
        onSparkleClick={() => {}}
        launching
      />
    </Frame>
  ),
};

export const Compact = {
  render: () => (
    <Frame>
      <QuestSummaryPill
        segments={PLACEHOLDER_SEGMENTS}
        onSegmentClick={() => {}}
        onSparkleClick={() => {}}
        compact
      />
    </Frame>
  ),
};

export const Live = {
  parameters: { happo: false },
  render: () => {
    const [open, setOpen] = React.useState<QuestPillSegmentKey | null>(null);
    return (
      <Frame>
        <QuestSummaryPill
          segments={RESOLVED}
          openSegment={open}
          onSegmentClick={(k) => setOpen((prev) => (prev === k ? null : k))}
          onClearSegment={() => {}}
          onSparkleClick={() => {}}
          dropdown={
            <div
              style={{
                padding: 24,
                borderRadius: 12,
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              }}
            >
              <p style={{ margin: 0, fontSize: 14 }}>Dropdown content for {open}</p>
            </div>
          }
        />
      </Frame>
    );
  },
};
