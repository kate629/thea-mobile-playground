import React from 'react';
import { QuizLoading } from './QuizLoading';
import { AmbientProductScroll } from './AmbientProductScroll';
import { SAMPLE_AMBIENT_IMAGES } from './sampleAmbientImages';

export default {
  title: 'Landing/Quiz/QuizLoading',
  component: QuizLoading,
};

/** Frozen slot config — used in deterministic Happo snapshots so the
 *  ambient images don't move between runs. */
const frozenSlots = SAMPLE_AMBIENT_IMAGES.slice(0, 6).map((image) => ({
  image,
  visible: true,
}));

export const TypingMidMessage = {
  render: () => (
    <QuizLoading text="Searching for pieces with a little spar" showCursor />
  ),
};

export const FullyTyped = {
  render: () => (
    <QuizLoading text="Searching for pieces with a little sparkle" showCursor={false} />
  ),
};

export const WithFrozenAmbient = {
  render: () => (
    <QuizLoading
      text="Rounding up gifts that sisters love"
      showCursor
      ambient={<AmbientProductScroll slots={frozenSlots} />}
    />
  ),
};
