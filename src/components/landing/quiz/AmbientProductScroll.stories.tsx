import React from 'react';
import { AmbientProductScroll } from './AmbientProductScroll';
import { AmbientProductScrollAnimated } from './AmbientProductScrollAnimated';
import { SAMPLE_AMBIENT_IMAGES } from './sampleAmbientImages';

export default {
  title: 'Surfaces/Quiz/AmbientProductScroll',
  component: AmbientProductScroll,
};

const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#FAF6F3' }}>
    {children}
  </div>
);

const sixSlots = SAMPLE_AMBIENT_IMAGES.slice(0, 6).map((image) => ({ image, visible: true }));

export const AllVisible = {
  render: () => (
    <Stage>
      <AmbientProductScroll slots={sixSlots} />
    </Stage>
  ),
};

export const AlternateHidden = {
  render: () => (
    <Stage>
      <AmbientProductScroll
        slots={sixSlots.map((s, i) => ({ ...s, visible: i % 2 === 0 }))}
      />
    </Stage>
  ),
};

export const NoImagesYet = {
  render: () => (
    <Stage>
      <AmbientProductScroll
        slots={new Array(6).fill(null).map(() => ({ image: null, visible: false }))}
      />
    </Stage>
  ),
};

export const Live = {
  parameters: { happo: false },
  render: () => (
    <Stage>
      <AmbientProductScrollAnimated images={SAMPLE_AMBIENT_IMAGES} />
    </Stage>
  ),
};
