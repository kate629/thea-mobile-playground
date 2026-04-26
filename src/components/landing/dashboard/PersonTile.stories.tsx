import React from 'react';
import { PersonTile } from './PersonTile';
import { SAMPLE_PREVIEW_IMAGES } from './sampleDashboardData';

export default {
  title: 'Surfaces/Dashboard/PersonTile',
  component: PersonTile,
};

const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ width: 220, padding: 16 }}>{children}</div>
);

export const Loading = {
  render: () => (
    <Frame>
      <PersonTile id="brother-1" name="Brother" emoji="✨" loading />
    </Frame>
  ),
};

export const EmojiOnly = {
  render: () => (
    <Frame>
      <PersonTile id="me" name="Me" emoji="🪩" isMe loading={false} previewImages={[]} />
    </Frame>
  ),
};

export const WithCollage = {
  render: () => (
    <Frame>
      <PersonTile
        id="mom-1"
        name="Mom"
        emoji="🌷"
        loading={false}
        previewImages={SAMPLE_PREVIEW_IMAGES['mom-1']}
      />
    </Frame>
  ),
};

export const TwoImages = {
  render: () => (
    <Frame>
      <PersonTile
        id="brother-1"
        name="Brother"
        emoji="✨"
        loading={false}
        previewImages={SAMPLE_PREVIEW_IMAGES['brother-1']}
      />
    </Frame>
  ),
};

export const Mobile = {
  parameters: { viewport: { defaultViewport: 'mobile' } },
  render: () => (
    <div style={{ width: 160, padding: 12 }}>
      <PersonTile id="me" name="Me" emoji="🪩" isMe loading={false} previewImages={[]} />
    </div>
  ),
};
