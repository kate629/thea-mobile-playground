import React from 'react';
import { PreviewCollage } from './PreviewCollage';
import { SAMPLE_PREVIEW_IMAGES } from './sampleDashboardData';

export default {
  title: 'Landing/Dashboard/PreviewCollage',
  component: PreviewCollage,
};

const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: 'relative',
      width: 240,
      aspectRatio: '4 / 5',
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid #E5E0D8',
    }}
  >
    {children}
  </div>
);

export const Loading = {
  render: () => (
    <Frame>
      <PreviewCollage images={[]} fallbackEmoji="✨" loading />
    </Frame>
  ),
};

export const Empty = {
  render: () => (
    <Frame>
      <PreviewCollage images={[]} fallbackEmoji="✨" loading={false} />
    </Frame>
  ),
};

export const OneImage = {
  render: () => (
    <Frame>
      <PreviewCollage images={SAMPLE_PREVIEW_IMAGES['mom-1'].slice(0, 1)} fallbackEmoji="🌷" loading={false} />
    </Frame>
  ),
};

export const TwoImages = {
  render: () => (
    <Frame>
      <PreviewCollage images={SAMPLE_PREVIEW_IMAGES['brother-1']} fallbackEmoji="✨" loading={false} />
    </Frame>
  ),
};

export const FourImages = {
  render: () => (
    <Frame>
      <PreviewCollage images={SAMPLE_PREVIEW_IMAGES['mom-1']} fallbackEmoji="🌷" loading={false} />
    </Frame>
  ),
};
