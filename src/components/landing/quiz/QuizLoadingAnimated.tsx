import React from 'react';
import { AmbientProductScrollAnimated } from './AmbientProductScrollAnimated';
import { ProductImage } from './AmbientProductScroll';
import { QuizLoading } from './QuizLoading';

export interface QuizLoadingAnimatedProps {
  /** Quiz answers — kept for API compatibility with the prior typewriter
   *  variant; not used now that the loading screen shows a single quote.
   *  Safe to remove once all callers stop passing them. */
  interests?: string[];
  relationship?: string;
  /** Live-arriving product images, for the ambient ring around the logo. */
  images?: ProductImage[];
}

// Single-message loading screen: a Nora T. testimonial held for the
// entire wait. The earlier rotating typewriter copy was intentionally
// removed — Kate wanted the user to focus on social proof while the
// algo spins up, not a parade of cute progress lines.
const LOADING_QUOTE =
  '"Thea helps me find things that I wouldn\'t have thought to search for. I love being able to pull up my granddaughter\'s board, find unique ideas, and send when the time is right."\n— Nora T.';

export const QuizLoadingAnimated: React.FC<QuizLoadingAnimatedProps> = ({
  images = [],
}) => (
  <QuizLoading
    text={LOADING_QUOTE}
    showCursor={false}
    largeText
    ambient={<AmbientProductScrollAnimated images={images} />}
  />
);
