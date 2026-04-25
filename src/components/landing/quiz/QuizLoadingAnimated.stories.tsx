import React from 'react';
import { QuizLoadingAnimated } from './QuizLoadingAnimated';
import { SAMPLE_AMBIENT_IMAGES } from './sampleAmbientImages';

export default {
  title: 'Landing/Quiz/QuizLoadingAnimated',
  component: QuizLoadingAnimated,
  parameters: { happo: false },
};

export const SisterCookingTravel = {
  render: () => (
    <QuizLoadingAnimated
      relationship="Sister"
      interests={['Cooking', 'Travel', 'Books']}
      images={SAMPLE_AMBIENT_IMAGES}
    />
  ),
};

export const NoInterestsNoRelationship = {
  render: () => (
    <QuizLoadingAnimated images={SAMPLE_AMBIENT_IMAGES} />
  ),
};

export const NoImagesYet = {
  render: () => (
    <QuizLoadingAnimated
      relationship="Mom"
      interests={['Jewelry', 'Plants']}
    />
  ),
};
