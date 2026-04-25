import React, { useMemo } from 'react';
import { AmbientProductScrollAnimated } from './AmbientProductScrollAnimated';
import { ProductImage } from './AmbientProductScroll';
import { QuizLoading } from './QuizLoading';
import { buildLoadingMessages } from './loadingMessages';
import { useQuizLoadingTypewriter } from './useQuizLoadingTypewriter';

export interface QuizLoadingAnimatedProps {
  /** Quiz answers — drives the rotating typewriter copy. */
  interests?: string[];
  relationship?: string;
  /** Live-arriving product images, for the ambient ring around the logo. */
  images?: ProductImage[];
}

export const QuizLoadingAnimated: React.FC<QuizLoadingAnimatedProps> = ({
  interests,
  relationship,
  images = [],
}) => {
  const messages = useMemo(
    () => buildLoadingMessages(interests, relationship),
    [interests, relationship],
  );
  const slice = useQuizLoadingTypewriter(messages);
  return (
    <QuizLoading
      text={slice.text}
      showCursor={slice.showCursor}
      ambient={<AmbientProductScrollAnimated images={images} />}
    />
  );
};
